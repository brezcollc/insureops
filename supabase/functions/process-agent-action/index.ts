/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AgentAction {
  action: "send_follow_up" | "update_status" | "add_note" | "wait";
  reason: string;
  new_status?: string;
  note?: string;
}

const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "decide_action",
      description: "Decide the next action for a loss run request",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["send_follow_up", "update_status", "add_note", "wait"],
            description: "The action to take",
          },
          reason: {
            type: "string",
            description: "Brief explanation for this decision",
          },
          new_status: {
            type: "string",
            enum: ["requested", "follow_up_sent", "received", "completed"],
            description: "New status if action is update_status",
          },
          note: {
            type: "string",
            description: "Note content if action is add_note",
          },
        },
        required: ["action", "reason"],
        additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = `You are an insurance operations agent processing loss run requests.

Your objective: Move each request from "requested" to "completed" efficiently.

Available actions:
- send_follow_up: Send a follow-up email to the carrier (use if request is >7 days old with no response)
- update_status: Change the request status (use when document received or processing complete)
- add_note: Add an internal note to the request (use to document important observations)
- wait: No action needed at this time

Rules:
- NEVER provide insurance advice
- NEVER infer or fabricate missing data
- All outputs require licensed professional review
- Be conservative - only take action when clearly warranted
- If the request is already "completed", always return "wait"
- If the request was recently created (<3 days) and status is "requested", return "wait"
- If follow-up was already sent recently (<7 days), return "wait"

Analyze the request state and decide the single best next action.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({ success: false, error: "Request ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the request with related data
    const { data: request, error: fetchError } = await supabase
      .from("loss_run_requests")
      .select(`
        *,
        clients (*),
        carriers (*)
      `)
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ success: false, error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch email logs for context
    const { data: emailLogs } = await supabase
      .from("email_logs")
      .select("*")
      .eq("request_id", requestId)
      .order("sent_at", { ascending: false })
      .limit(5);

    // Build context for the AI
    const now = new Date();
    const requestDate = new Date(request.request_date);
    const daysSinceRequest = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const lastEmail = emailLogs?.[0];
    const daysSinceLastEmail = lastEmail 
      ? Math.floor((now.getTime() - new Date(lastEmail.sent_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const contextPrompt = `
Current Request State:
- Client: ${request.clients?.name || "Unknown"}
- Carrier: ${request.carriers?.name || "Unknown"}
- Policy Number: ${request.policy_number}
- Coverage Type: ${request.coverage_type}
- Current Status: ${request.status}
- Request Date: ${request.request_date} (${daysSinceRequest} days ago)
- Notes: ${request.notes || "None"}

Email History:
- Total emails sent: ${emailLogs?.length || 0}
- Last email: ${lastEmail ? `${lastEmail.email_type} sent ${daysSinceLastEmail} days ago` : "None"}
${emailLogs?.map(e => `  - ${e.email_type}: ${new Date(e.sent_at).toLocaleDateString()}`).join("\n") || "  No emails sent"}

What is the next best action for this request?`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contextPrompt },
        ],
        tools: AGENT_TOOLS,
        tool_choice: { type: "function", function: { name: "decide_action" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "decide_action") {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to get agent decision" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const decision: AgentAction = JSON.parse(toolCall.function.arguments);
    let actionResult = { executed: false, details: "" };

    // Execute the decided action
    switch (decision.action) {
      case "send_follow_up": {
        // Call the send-loss-run-email function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-loss-run-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: request.id,
            clientName: request.clients?.name || "Unknown Client",
            carrierName: request.carriers?.name || "Unknown Carrier",
            carrierEmail: request.carriers?.loss_run_email,
            policyNumber: request.policy_number,
            coverageType: request.coverage_type,
            policyEffectiveDate: request.policy_effective_date,
            policyExpirationDate: request.policy_expiration_date,
            isFollowUp: true,
          }),
        });

        if (emailResponse.ok) {
          // Update status to follow_up_sent
          await supabase
            .from("loss_run_requests")
            .update({ status: "follow_up_sent" })
            .eq("id", requestId);
          actionResult = { executed: true, details: "Follow-up email sent and status updated" };
        } else {
          actionResult = { executed: false, details: "Failed to send follow-up email" };
        }
        break;
      }

      case "update_status": {
        if (decision.new_status) {
          await supabase
            .from("loss_run_requests")
            .update({ status: decision.new_status })
            .eq("id", requestId);
          actionResult = { executed: true, details: `Status updated to ${decision.new_status}` };
        }
        break;
      }

      case "add_note": {
        if (decision.note) {
          const existingNotes = request.notes || "";
          const timestamp = new Date().toISOString().split("T")[0];
          const newNotes = existingNotes 
            ? `${existingNotes}\n\n[${timestamp}] Agent: ${decision.note}`
            : `[${timestamp}] Agent: ${decision.note}`;
          
          await supabase
            .from("loss_run_requests")
            .update({ notes: newNotes })
            .eq("id", requestId);
          actionResult = { executed: true, details: "Note added to request" };
        }
        break;
      }

      case "wait":
      default:
        actionResult = { executed: false, details: "No action needed at this time" };
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        decision: {
          action: decision.action,
          reason: decision.reason,
        },
        result: actionResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
