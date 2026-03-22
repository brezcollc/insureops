import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://insureopsio.com",
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
  followUpNumber?: number; // 1 = first follow-up, 2 = second, 3 = final notice
  senderName?: string;
  senderEmail?: string;
  agencyName?: string;
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
  if (data.customSubject && data.customBody) {
    const subject = data.customSubject;
    const body = data.customBody;
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

  const coverageTypeFormatted = formatCoverageType(data.coverageType);
  const followUpNumber = data.followUpNumber || 0;
  const senderName = data.senderName || "Insurance Operations Team";
  const agencyName = data.agencyName || "";

  const policyPeriod = data.policyEffectiveDate && data.policyExpirationDate
    ? `${data.policyEffectiveDate} to ${data.policyExpirationDate}`
    : "All available history";

  const insuredBlock = `Insured: ${data.clientName}
Policy Number: ${data.policyNumber}
Line of Business: ${coverageTypeFormatted}
Policy Period: ${policyPeriod}`;

  let subject: string;
  let body: string;
  let urgencyColor = "#2563eb";
  let urgencyLabel = "";

  if (followUpNumber === 0 || !data.isFollowUp) {
    // Initial request
    subject = `Loss Run Request – ${data.clientName} (${coverageTypeFormatted})`;
    body = `Dear Loss Runs Department,

We are requesting loss run reports for the following insured:

${insuredBlock}

Please provide the most recent five years of loss history, including all open and closed claims with dates of loss, descriptions, paid and reserved amounts, and current status.

If any additional information is needed to fulfill this request, please let us know.

Thank you,
${senderName}
${agencyName}`.trim();

  } else if (followUpNumber === 1) {
    // First follow-up – Day 7, friendly reminder
    subject = `Follow-Up: Loss Run Request – ${data.clientName} (${coverageTypeFormatted})`;
    urgencyLabel = "Follow-up — previous request pending";
    urgencyColor = "#d97706";
    body = `Dear Loss Runs Department,

This is a follow-up to our loss run request submitted approximately one week ago. We have not yet received the requested documents and wanted to check in.

${insuredBlock}

Please provide the most recent five years of loss history at your earliest convenience. If there is anything else needed to process this request, please let us know.

Thank you,
${senderName}
${agencyName}`.trim();

  } else if (followUpNumber === 2) {
    // Second follow-up – Day 14, mention renewal pressure
    subject = `Second Follow-Up: Loss Run Request – ${data.clientName} (${coverageTypeFormatted})`;
    urgencyLabel = "Second follow-up — action required";
    urgencyColor = "#ea580c";
    body = `Dear Loss Runs Department,

We are following up again regarding our pending loss run request for the insured listed below. This is our second follow-up and we have not yet received the requested documents.

${insuredBlock}

Please be advised that we are working on an upcoming renewal for this account and timely receipt of the loss runs is important to this process. We would appreciate your prompt attention to this matter.

If there are any issues fulfilling this request, please contact us immediately.

Thank you,
${senderName}
${agencyName}`.trim();

  } else {
    // Final notice – Day 21+, escalation
    subject = `URGENT – Final Notice: Loss Run Request – ${data.clientName} (${coverageTypeFormatted})`;
    urgencyLabel = "FINAL NOTICE — escalation required";
    urgencyColor = "#b91c1c";
    body = `Dear Loss Runs Department,

This is our final follow-up regarding the outstanding loss run request listed below. Despite our previous requests, we have not yet received the required documents.

${insuredBlock}

We are requesting that this matter be escalated within your organization. The continued delay is impacting our client's renewal process. If we do not receive the loss runs within the next 5 business days, we will need to notify our client of the delay and explore alternative options.

Please contact us immediately to resolve this matter.

Thank you,
${senderName}
${agencyName}`.trim();
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f9fafb; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    .content { background: #ffffff; border-radius: 6px; padding: 32px; border: 1px solid #e5e7eb; }
    .urgency-banner { font-weight: 600; margin-top: 0; margin-bottom: 16px; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
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
      ${urgencyLabel ? `<p class="urgency-banner" style="color: ${urgencyColor}; background-color: ${urgencyColor}18;">${urgencyLabel}</p>` : ""}
      <p style="margin-top: 0;">Dear Loss Runs Department,</p>
      ${followUpNumber === 0 || !data.isFollowUp
        ? `<p>We are requesting loss run reports for the following insured:</p>`
        : followUpNumber === 1
        ? `<p>This is a follow-up to our loss run request submitted approximately one week ago. We have not yet received the requested documents and wanted to check in.</p>`
        : followUpNumber === 2
        ? `<p>We are following up again regarding our pending loss run request for the insured listed below. This is our second follow-up and we have not yet received the requested documents.</p>`
        : `<p>This is our final follow-up regarding the outstanding loss run request listed below. Despite our previous requests, we have not yet received the required documents.</p>`
      }
      <div class="details">
        <div class="detail-row"><span class="detail-label">Insured:</span> ${data.clientName}</div>
        <div class="detail-row"><span class="detail-label">Policy Number:</span> ${data.policyNumber}</div>
        <div class="detail-row"><span class="detail-label">Line of Business:</span> ${coverageTypeFormatted}</div>
        <div class="detail-row"><span class="detail-label">Policy Period:</span> ${policyPeriod}</div>
      </div>
      ${followUpNumber === 0 || !data.isFollowUp
        ? `<p>Please provide the most recent five years of loss history, including all open and closed claims with dates of loss, descriptions, paid and reserved amounts, and current status.</p>
           <p>If any additional information is needed to fulfill this request, please let us know.</p>`
        : followUpNumber === 1
        ? `<p>Please provide the most recent five years of loss history at your earliest convenience. If there is anything else needed to process this request, please let us know.</p>`
        : followUpNumber === 2
        ? `<p>Please be advised that we are working on an upcoming renewal for this account and timely receipt of the loss runs is important to this process. We would appreciate your prompt attention.</p>
           <p>If there are any issues fulfilling this request, please contact us immediately.</p>`
        : `<p>We are requesting that this matter be escalated within your organization. The continued delay is impacting our client's renewal process. If we do not receive the loss runs within the next <strong>5 business days</strong>, we will need to notify our client of the delay and explore alternative options.</p>
           <p>Please contact us immediately to resolve this matter.</p>`
      }
      <div class="sig">
        <p style="margin: 0;">Thank you,</p>
        <p class="sig-name" style="margin: 4px 0 0;">${senderName}</p>
        ${agencyName ? `<p class="sig-agency" style="margin: 2px 0 0;">${agencyName}</p>` : ""}
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
    const authHeader = req.headers.get("Authorization");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    if (!isServiceRole) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
      if (claimsError || !claimsData?.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service unavailable");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase configuration is missing");
      throw new Error("Service configuration error");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const data: LossRunEmailRequest = await req.json();

    if (!data.requestId || !data.clientName || !data.carrierEmail || !data.policyNumber || !data.coverageType) {
      throw new Error("Missing required fields");
    }

    const { subject, body, html } = generateEmailContent(data);
    const recipient = data.carrierEmail;

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

    // Determine email type for logging
    const followUpNumber = data.followUpNumber || 0;
    let emailType: string;
    if (!data.isFollowUp || followUpNumber === 0) {
      emailType = "initial_request";
    } else if (followUpNumber === 1) {
      emailType = "follow_up";
    } else if (followUpNumber === 2) {
      emailType = "follow_up";
    } else {
      emailType = "reminder";
    }

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
    }

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
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-loss-run-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
