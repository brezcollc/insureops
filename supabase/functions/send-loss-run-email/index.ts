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
    
    // Convert plain text body to HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</pre>
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
    ? `FOLLOW-UP: Loss Run Request - ${data.clientName} - Policy ${data.policyNumber}`
    : `Loss Run Request - ${data.clientName} - Policy ${data.policyNumber}`;

  const policyPeriod = data.policyEffectiveDate && data.policyExpirationDate
    ? `Policy Period: ${data.policyEffectiveDate} to ${data.policyExpirationDate}`
    : "Policy Period: Please provide all available loss history";

  const followUpNote = isFollowUp
    ? `<p style="color: #dc2626; font-weight: bold;">This is a follow-up to our previous request. We kindly ask for your prompt attention to this matter.</p>`
    : "";

  const body = `
${isFollowUp ? "FOLLOW-UP REQUEST\n\n" : ""}Dear Loss Runs Department,

We are writing to request loss run information for the following insured:

Insured Name: ${data.clientName}
Policy Number: ${data.policyNumber}
Coverage Type: ${coverageTypeFormatted}
${policyPeriod}

Please provide loss runs covering the most recent 5 years of coverage history, including:
- All open and closed claims
- Claim numbers, dates of loss, and descriptions
- Paid, reserved, and incurred amounts
- Current claim status

If you have any questions or need additional information to process this request, please do not hesitate to contact us.

Thank you for your prompt attention to this request.

Best regards,
${senderName}
${agencyName}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
    .info-box { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; color: #475569; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    ${followUpNote}
    <div class="header">
      <h2 style="margin: 0; color: #1e40af;">Loss Run Request</h2>
    </div>
    
    <p>Dear Loss Runs Department,</p>
    
    <p>We are writing to request loss run information for the following insured:</p>
    
    <div class="info-box">
      <div class="info-row"><span class="label">Insured Name:</span> ${data.clientName}</div>
      <div class="info-row"><span class="label">Policy Number:</span> ${data.policyNumber}</div>
      <div class="info-row"><span class="label">Coverage Type:</span> ${coverageTypeFormatted}</div>
      <div class="info-row"><span class="label">${policyPeriod}</span></div>
    </div>
    
    <p>Please provide loss runs covering the most recent 5 years of coverage history, including:</p>
    <ul>
      <li>All open and closed claims</li>
      <li>Claim numbers, dates of loss, and descriptions</li>
      <li>Paid, reserved, and incurred amounts</li>
      <li>Current claim status</li>
    </ul>
    
    <p>If you have any questions or need additional information to process this request, please do not hesitate to contact us.</p>
    
    <p>Thank you for your prompt attention to this request.</p>
    
    <div class="footer">
      <p>
        Best regards,<br>
        <strong>${senderName}</strong><br>
        ${agencyName}
      </p>
    </div>
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
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service unavailable");
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

    const data: LossRunEmailRequest = await req.json();

    // Validate required fields
    if (!data.requestId || !data.clientName || !data.carrierEmail || !data.policyNumber || !data.coverageType) {
      throw new Error("Missing required fields");
    }

    // Generate email content
    const { subject, body, html } = generateEmailContent(data);

    // Use test recipient when using Resend sandbox (unverified domain)
    // Production: verify your domain at resend.com/domains and update the from address
    const isTestMode = true; // Set to false after verifying domain
    const testRecipient = "brezcollc@gmail.com";
    const recipient = isTestMode ? testRecipient : data.carrierEmail;

    // Send the email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Loss Run Requests <onboarding@resend.dev>",
        to: [recipient],
        subject: subject,
        html: html,
        text: body,
      }),
    });

    console.log(`Email sent to ${recipient} (test mode: ${isTestMode}, original: ${data.carrierEmail})`);

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
