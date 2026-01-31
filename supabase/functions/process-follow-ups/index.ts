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
  clients: { id: string; name: string } | null;
  carriers: { id: string; name: string; loss_run_email: string } | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find requests that are 7+ days old and still in "requested" status
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
        clients (id, name),
        carriers (id, name, loss_run_email)
      `)
      .eq("status", "requested")
      .lte("request_date", sevenDaysAgo.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch pending requests: ${fetchError.message}`);
    }

    console.log(`Found ${pendingRequests?.length || 0} requests needing follow-up`);

    const results: Array<{ requestId: string; success: boolean; error?: string }> = [];

    for (const rawRequest of pendingRequests || []) {
      const request = rawRequest as unknown as RequestWithRelations;
      
      try {
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

        results.push({ requestId: request.id, success: true });
        console.log(`Follow-up sent for request ${request.id}`);
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
