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
  request_date: string;
  notes: string | null;
  organization_id: string;
  clients: { id: string; name: string } | null;
  carriers: { id: string; name: string; loss_run_email: string } | null;
  organizations: { id: string; name: string } | null;
}

interface EmailLogRecord {
  id: string;
  email_type: string;
  sent_at: string;
}

const MAX_FOLLOW_UPS = 3;
const FOLLOW_UP_INTERVAL_DAYS = 7;

async function getEmailLogs(supabase: any, requestId: string): Promise<EmailLogRecord[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("id, email_type, sent_at")
    .eq("request_id", requestId)
    .order("sent_at", { ascending: false });
  if (error) { console.error("Error fetching email logs:", error); return []; }
  return data || [];
}

async function addNoteToRequest(supabase: any, requestId: string, note: string, existingNotes: string | null): Promise<void> {
  const timestamp = new Date().toISOString().split("T")[0];
  const newNotes = existingNotes
    ? `${existingNotes}\n\n[${timestamp}] System: ${note}`
    : `[${timestamp}] System: ${note}`;
  const { error } = await supabase.from("loss_run_requests").update({ notes: newNotes }).eq("id", requestId);
  if (error) console.error("Error adding note:", error);
}

async function logAgentAction(supabase: any, requestId: string, actionTaken: string, actionResult: string): Promise<void> {
  try {
    const { error } = await supabase.from("agent_action_logs").insert([{
      request_id: requestId, trigger_type: "follow_up", action_taken: actionTaken, action_result: actionResult,
    }]);
    if (error) console.error("Error logging agent action:", error);
  } catch (e) { console.error("Exception logging agent action:", e); }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    if (!isServiceRole) {
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await authClient.auth.getUser(token);
      if (authError || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all active non-reviewed requests
    const { data: pendingRequests, error: fetchError } = await supabase
      .from("loss_run_requests")
      .select(`
        id, policy_number, coverage_type, policy_effective_date, policy_expiration_date,
        reviewed_at, request_date, notes, organization_id,
        clients (id, name),
        carriers (id, name, loss_run_email),
        organizations (id, name)
      `)
      .in("status", ["requested", "follow_up_sent"])
      .is("reviewed_at", null);

    if (fetchError) {
      console.error("Failed to fetch pending requests:", fetchError);
      throw new Error("Failed to process follow-ups");
    }

    console.log(`Found ${pendingRequests?.length || 0} active requests to evaluate`);

    const results: Array<{ requestId: string; success: boolean; action: string; error?: string }> = [];

    for (const rawRequest of pendingRequests || []) {
      const request = rawRequest as unknown as RequestWithRelations;

      try {
        // Get all email logs for this request
        const emailLogs = await getEmailLogs(supabase, request.id);

        // Count only follow-up emails (not the initial request)
        const followUpLogs = emailLogs.filter(e => e.email_type !== "initial_request");
        const followUpCount = followUpLogs.length;

        // If max follow-ups reached, flag for human escalation (only once)
        if (followUpCount >= MAX_FOLLOW_UPS) {
          const alreadyFlagged = (request.notes || "").includes("Maximum follow-ups reached");
          if (!alreadyFlagged) {
            await addNoteToRequest(
              supabase,
              request.id,
              `Maximum follow-ups reached (${MAX_FOLLOW_UPS} sent with no response). Manual escalation required — consider calling the carrier directly.`,
              request.notes
            );
            await logAgentAction(supabase, request.id, "flagged", `Max follow-ups (${MAX_FOLLOW_UPS}) reached. Human escalation required.`);
            results.push({ requestId: request.id, success: true, action: "flagged_for_escalation" });
          } else {
            results.push({ requestId: request.id, success: false, action: "skipped", error: "Already flagged for escalation" });
          }
          continue;
        }

        // Determine how long since last contact
        const now = new Date();
        const mostRecentEmail = emailLogs[0]; // sorted descending, so first = most recent
        const lastContactDate = mostRecentEmail
          ? new Date(mostRecentEmail.sent_at)
          : new Date(request.request_date);

        const daysSinceLastContact = Math.floor(
          (now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const daysSinceRequest = Math.floor(
          (now.getTime() - new Date(request.request_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Skip if it hasn't been 7 days since last contact or since the original request
        if (daysSinceLastContact < FOLLOW_UP_INTERVAL_DAYS || daysSinceRequest < FOLLOW_UP_INTERVAL_DAYS) {
          console.log(`Skipping request ${request.id}: ${daysSinceLastContact} days since last contact`);
          results.push({ requestId: request.id, success: false, action: "skipped", error: `Only ${daysSinceLastContact} days since last contact` });
          continue;
        }

        if (!request.carriers?.loss_run_email) {
          results.push({ requestId: request.id, success: false, action: "skipped", error: "No carrier email on file" });
          continue;
        }

        const followUpNumber = followUpCount + 1; // 1, 2, or 3
        const orgName = request.organizations?.name || "";

        const emailPayload = {
          requestId: request.id,
          clientName: request.clients?.name || "Unknown Client",
          carrierName: request.carriers?.name || "Unknown Carrier",
          carrierEmail: request.carriers.loss_run_email,
          policyNumber: request.policy_number,
          coverageType: request.coverage_type,
          policyEffectiveDate: request.policy_effective_date,
          policyExpirationDate: request.policy_expiration_date,
          isFollowUp: true,
          followUpNumber,
          agencyName: orgName,
        };

        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-loss-run-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Email send failed: ${errorText}`);
        }

        const followUpLabel = followUpNumber === 1 ? "1st" : followUpNumber === 2 ? "2nd" : "3rd (final notice)";
        await logAgentAction(
          supabase,
          request.id,
          "send_follow_up",
          `Auto ${followUpLabel} follow-up sent (${daysSinceRequest} days since original request, ${daysSinceLastContact} days since last contact)`
        );

        results.push({ requestId: request.id, success: true, action: `follow_up_${followUpNumber}` });

      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        await logAgentAction(supabase, request.id, "send_follow_up", `Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        results.push({ requestId: request.id, success: false, action: "error", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in process-follow-ups function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
