import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignupNotificationRequest {
  email: string;
  timestamp: string;
}

const ADMIN_EMAIL = "brezcollc@gmail.com";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service unavailable");
    }

    const data: SignupNotificationRequest = await req.json();

    // Validate required fields
    if (!data.email) {
      throw new Error("Missing email field");
    }

    const formattedDate = new Date(data.timestamp).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const subject = "New Early Access Signup";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 0 auto; padding: 30px; }
    .header { border-bottom: 2px solid #0ea5a9; padding-bottom: 15px; margin-bottom: 25px; }
    .header h2 { margin: 0; color: #0c7c82; }
    .info-box { background-color: #f0fdfa; border-left: 4px solid #0ea5a9; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #0c7c82; display: inline-block; width: 100px; }
    .value { color: #1f2937; }
    .note { color: #6b7280; font-size: 14px; margin-top: 20px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎉 New Early Access Signup</h2>
    </div>
    
    <p>A new user has requested early access via the InsureOps landing page.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
      </div>
      <div class="info-row">
        <span class="label">Submitted:</span>
        <span class="value">${formattedDate}</span>
      </div>
    </div>
    
    <p class="note">You can view all signups in your database under the <code>interest_signups</code> table.</p>
    
    <div class="footer">
      <p>This notification was sent automatically by InsureOps.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const textBody = `
New Early Access Signup

A new user has requested early access via the InsureOps landing page.

Email: ${data.email}
Submitted: ${formattedDate}

You can view all signups in your database under the interest_signups table.
    `.trim();

    // Send the email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InsureOps <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: subject,
        html: html,
        text: textBody,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send notification. Please try again later.");
    }

    const emailResult = await emailResponse.json();
    console.log("Admin notification email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in notify-signup function:", error);
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
