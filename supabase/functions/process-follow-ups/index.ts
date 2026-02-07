import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestWithRelations {
  id: string;
  policy_number: string;
  coverage_type: string;
  policy_effective_date: string | null;
  policy_expiration_date: string | null;
  reviewed_at: string | null;
  clients: { id: string; name: string } | null;
  carriers: { id: string; name: string; loss_run_email: string } | null;
}

// Check if a follow-up was already sent within the time window
async function hasRecentFollowUp(
  supabase: any,
  requestId: string,
  daysWindow: number = 7
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - daysWindow);

  const { data, error } = await supabase
    .from("agent_action_logs")
    .select("id")
    .eq("request_id", requestId)
    .eq("action_taken", "send_follow_up")
    .gte("created_at", windowStart.toISOString())
    .limit(1);

  if (error) {
    console.error("Error checking recent follow-up:", error);
    return false;
  }

  return (data?.length || 0) > 0;
}

// Log agent action for auditability
async function logAgentAction(
  supabase: any,
  requestId: string,
  actionTaken: string,
  actionResult: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("agent_action_logs")
      .insert([{
        request_id: requestId,
        trigger_type: "follow_up",
        action_taken: actionTaken,
        action_result: actionResult,
      }]);

    if (error) {
      console.error("Error logging agent action:", error);
    }
  } catch (e) {
    console.error("Exception logging agent action:", e);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error("Supabase configuration is missing");
      throw new Error("Service configuration error");
    }

    // Validate the user's token
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find requests that are 7+ days old, still in "requested" or "follow_up_sent" status,
    // and NOT reviewed (reviewed_at IS NULL)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: pendingRequests, error: fetchError } = await supabase
      .from("loss_run_requests")
      .select(`
        id,
        policy_number,
        coverage_type,
        policy_effective_date,
        policy_expiration_date,
        reviewed_at,
        clients (id, name),
        carriers (id, name, loss_run_email)
      `)
      .in("status", ["requested", "follow_up_sent"])
      .is("reviewed_at", null)
      .lte("request_date", sevenDaysAgo.toISOString());

    if (fetchError) {
      console.error("Failed to fetch pending requests:", fetchError);
      throw new Error("Failed to process follow-ups");
    }

    console.log(`Found ${pendingRequests?.length || 0} requests needing follow-up`);

    const results: Array<{ requestId: string; success: boolean; error?: string }> = [];

    for (const rawRequest of pendingRequests || []) {
      const request = rawRequest as unknown as RequestWithRelations;
      
      try {
        // CRITICAL: Double-check reviewed status (defense in depth)
        if (request.reviewed_at) {
          console.log(`Skipping reviewed request ${request.id}`);
          await logAgentAction(supabase, request.id, "blocked", "Request is reviewed and locked");
          results.push({ requestId: request.id, success: false, error: "Request is reviewed" });
          continue;
        }

        // Check for duplicate follow-up within 7 days
        const hasDuplicate = await hasRecentFollowUp(supabase, request.id, 7);
        if (hasDuplicate) {
          console.log(`Skipping request ${request.id} - follow-up already sent recently`);
          await logAgentAction(supabase, request.id, "skipped", "Follow-up already sent within 7 days");
          results.push({ requestId: request.id, success: false, error: "Recent follow-up exists" });
          continue;
        }

        // Call the send-loss-run-email function for each request
        const emailPayload = {
          requestId: request.id,
          clientName: request.clients?.name || "Unknown Client",
          carrierName: request.carriers?.name || "Unknown Carrier",
          carrierEmail: request.carriers?.loss_run_email,
          policyNumber: request.policy_number,
          coverageType: request.coverage_type,
          policyEffectiveDate: request.policy_effective_date,
          policyExpirationDate: request.policy_expiration_date,
          isFollowUp: true,
        };

        if (!emailPayload.carrierEmail) {
          console.error(`No carrier email for request ${request.id}`);
          results.push({ requestId: request.id, success: false, error: "No carrier email" });
          continue;
        }

        // Call the email function
        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-loss-run-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Email send failed: ${errorText}`);
        }

        // Log successful follow-up
        await logAgentAction(supabase, request.id, "send_follow_up", "Auto follow-up email sent successfully");

        results.push({ requestId: request.id, success: true });
        console.log(`Follow-up sent for request ${request.id}`);
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        await logAgentAction(
          supabase, 
          request.id, 
          "send_follow_up", 
          `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        results.push({
          requestId: request.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in process-follow-ups function:", error);
    // Return generic error message - details are logged server-side
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
