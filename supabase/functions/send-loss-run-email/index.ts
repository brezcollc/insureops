import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LossRunEmailRequest {
  requestId: string;
  clientName: string;
  carrierName: string;
  carrierEmail: string;
  policyNumber: string;
  coverageType: string;
  policyEffectiveDate?: string;
  policyExpirationDate?: string;
  isFollowUp?: boolean;
  senderName?: string;
  senderEmail?: string;
  agencyName?: string;
  // Custom template support
  customSubject?: string;
  customBody?: string;
  templateId?: string;
}

const formatCoverageType = (type: string): string => {
  const mapping: Record<string, string> = {
    general_liability: "General Liability",
    workers_compensation: "Workers' Compensation",
    commercial_auto: "Commercial Auto",
    commercial_property: "Commercial Property",
    professional_liability: "Professional Liability",
    umbrella: "Umbrella",
    other: "Other",
  };
  return mapping[type] || type;
};

const generateEmailContent = (data: LossRunEmailRequest): { subject: string; body: string; html: string } => {
  // If custom content provided, use it directly
  if (data.customSubject && data.customBody) {
    const subject = data.customSubject;
    const body = data.customBody;
    
    // Convert plain text body to HTML with professional formatting
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f9fafb; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    .content { background: #ffffff; border-radius: 6px; padding: 32px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding-top: 24px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      <pre style="font-family: Arial, sans-serif; white-space: pre-wrap; margin: 0; font-size: 14px; line-height: 1.7;">${body}</pre>
    </div>
    <div class="footer">Sent via InsureOps</div>
  </div>
</body>
</html>
    `.trim();

    return { subject, body, html };
  }

  // Default template generation
  const coverageTypeFormatted = formatCoverageType(data.coverageType);
  const isFollowUp = data.isFollowUp || false;
  const senderName = data.senderName || "Insurance Operations Team";
  const agencyName = data.agencyName || "Acme Insurance Group";

  const subject = isFollowUp
    ? `Follow-Up: Loss Run Request – ${data.clientName} (${coverageTypeFormatted})`
    : `Loss Run Request – ${data.clientName} (${coverageTypeFormatted})`;

  const policyPeriod = data.policyEffectiveDate && data.policyExpirationDate
    ? `${data.policyEffectiveDate} to ${data.policyExpirationDate}`
    : "All available history";

  const followUpNote = isFollowUp
    ? `\n\nThis is a follow-up to our previous request. We would appreciate your prompt attention.\n`
    : "";

  const body = `Dear Loss Runs Department,${followUpNote}

We are requesting loss run reports for the following insured:

Insured: ${data.clientName}
Policy Number: ${data.policyNumber}
Line of Business: ${coverageTypeFormatted}
Policy Period: ${policyPeriod}

Please provide the most recent five years of loss history, including all open and closed claims with dates of loss, descriptions, paid and reserved amounts, and current status.

If any additional information is needed to fulfill this request, please let us know.

Thank you,
${senderName}
${agencyName}`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f9fafb; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    .content { background: #ffffff; border-radius: 6px; padding: 32px; border: 1px solid #e5e7eb; }
    .details { background: #f8fafc; border-left: 3px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }
    .detail-row { margin: 6px 0; font-size: 14px; }
    .detail-label { font-weight: 600; color: #374151; }
    .sig { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px; }
    .sig-name { font-weight: 600; color: #111827; }
    .sig-agency { color: #6b7280; }
    .footer { text-align: center; padding-top: 24px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="content">
      ${isFollowUp ? '<p style="color: #b91c1c; font-weight: 600; margin-top: 0;">Follow-up — previous request pending</p>' : ''}
      <p style="margin-top: 0;">Dear Loss Runs Department,</p>
      
      <p>We are requesting loss run reports for the following insured:</p>
      
      <div class="details">
        <div class="detail-row"><span class="detail-label">Insured:</span> ${data.clientName}</div>
        <div class="detail-row"><span class="detail-label">Policy Number:</span> ${data.policyNumber}</div>
        <div class="detail-row"><span class="detail-label">Line of Business:</span> ${coverageTypeFormatted}</div>
        <div class="detail-row"><span class="detail-label">Policy Period:</span> ${policyPeriod}</div>
      </div>
      
      <p>Please provide the most recent five years of loss history, including all open and closed claims with dates of loss, descriptions, paid and reserved amounts, and current status.</p>
      
      <p>If any additional information is needed to fulfill this request, please let us know.</p>
      
      <div class="sig">
        <p style="margin: 0;">Thank you,</p>
        <p class="sig-name" style="margin: 4px 0 0;">${senderName}</p>
        <p class="sig-agency" style="margin: 2px 0 0;">${agencyName}</p>
      </div>
    </div>
    <div class="footer">Sent via InsureOps</div>
  </div>
</body>
</html>
  `.trim();

  return { subject, body, html };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication enforcement
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service unavailable");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase configuration is missing");
      throw new Error("Service configuration error");
    }

    // Use service role key for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const data: LossRunEmailRequest = await req.json();

    // Validate required fields
    if (!data.requestId || !data.clientName || !data.carrierEmail || !data.policyNumber || !data.coverageType) {
      throw new Error("Missing required fields");
    }

    // Generate email content
    const { subject, body, html } = generateEmailContent(data);

    // Domain insureopsio.com is verified on Resend – send directly to the carrier.
    const recipient = data.carrierEmail;

    // Send the email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Loss Run Requests <noreply@insureopsio.com>",
        to: [recipient],
        subject: subject,
        html: html,
        text: body,
      }),
    });

    console.log(`Email sent to ${recipient}`);

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email. Please try again later.");
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    // Log the email in the database
    const emailType = data.isFollowUp ? "follow_up" : "initial_request";
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        request_id: data.requestId,
        email_type: emailType,
        recipient: data.carrierEmail,
        subject: subject,
        body: body,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Error logging email:", logError);
      // Don't throw - email was sent, just logging failed
    }

    // Update request status if follow-up
    if (data.isFollowUp) {
      const { error: updateError } = await supabase
        .from("loss_run_requests")
        .update({ status: "follow_up_sent" })
        .eq("id", data.requestId);

      if (updateError) {
        console.error("Error updating request status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-loss-run-email function:", error);
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
