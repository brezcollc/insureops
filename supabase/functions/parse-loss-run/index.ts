/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOSS_RUN_SCHEMA = {
  type: "object",
  properties: {
    document_info: {
      type: "object",
      properties: {
        carrier_name: { type: "string", description: "Insurance carrier name exactly as written" },
        policy_number: { type: "string", description: "Policy number exactly as written" },
        insured_name: { type: "string", description: "Named insured exactly as written" },
        report_date: { type: "string", description: "Date the loss run was generated (YYYY-MM-DD or null)" },
        policy_effective_date: { type: "string", description: "Policy effective date (YYYY-MM-DD or null)" },
        policy_expiration_date: { type: "string", description: "Policy expiration date (YYYY-MM-DD or null)" },
        line_of_business: { type: "string", description: "Line of business (e.g., Workers Comp, General Liability)" },
      },
      required: ["carrier_name", "policy_number", "insured_name"],
      additionalProperties: false,
    },
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim_number: { type: "string", description: "Claim number exactly as written" },
          claimant_name: { type: "string", description: "Claimant name exactly as written, or null if not shown" },
          date_of_loss: { type: "string", description: "Date of loss (YYYY-MM-DD or null)" },
          date_reported: { type: "string", description: "Date reported (YYYY-MM-DD or null)" },
          claim_status: { type: "string", description: "Claim status exactly as written (Open, Closed, etc.)" },
          cause_of_loss: { type: "string", description: "Cause/description of loss exactly as written" },
          injury_type: { type: "string", description: "Type of injury if applicable, exactly as written" },
          body_part: { type: "string", description: "Body part injured if applicable, exactly as written" },
          paid_indemnity: { type: "number", description: "Paid indemnity amount, or null if not shown" },
          paid_medical: { type: "number", description: "Paid medical amount, or null if not shown" },
          paid_expense: { type: "number", description: "Paid expense/legal amount, or null if not shown" },
          total_paid: { type: "number", description: "Total paid amount, or null if not shown" },
          reserved_indemnity: { type: "number", description: "Reserved indemnity amount, or null" },
          reserved_medical: { type: "number", description: "Reserved medical amount, or null" },
          reserved_expense: { type: "number", description: "Reserved expense amount, or null" },
          total_reserved: { type: "number", description: "Total reserves, or null if not shown" },
          total_incurred: { type: "number", description: "Total incurred (paid + reserved), or null" },
          subrogation: { type: "number", description: "Subrogation recovery amount, or null" },
          notes: { type: "string", description: "Any additional notes or comments on the claim" },
        },
        required: ["claim_number", "claim_status"],
        additionalProperties: false,
      },
    },
    summary: {
      type: "object",
      properties: {
        total_claims: { type: "number", description: "Total number of claims shown" },
        open_claims: { type: "number", description: "Number of open claims, or null" },
        closed_claims: { type: "number", description: "Number of closed claims, or null" },
        total_paid: { type: "number", description: "Grand total paid amount, or null" },
        total_reserved: { type: "number", description: "Grand total reserves, or null" },
        total_incurred: { type: "number", description: "Grand total incurred, or null" },
        valuation_date: { type: "string", description: "As-of date for the values (YYYY-MM-DD or null)" },
      },
      additionalProperties: false,
    },
  },
  required: ["document_info", "claims"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();

    if (!documentText || typeof documentText !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Document text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an insurance loss run document parser.

Your task is to extract structured claim data EXACTLY as written in the provided loss run document.

STRICT RULES:
- Do NOT infer, calculate, or estimate any values
- Do NOT combine fields unless explicitly shown together
- Do NOT interpret coverage, claim quality, or loss severity
- Do NOT alter carrier terminology - use exact wording from the document
- If a field is missing, unclear, or not explicitly shown, return null
- Dates should be formatted as YYYY-MM-DD when possible, or null if unclear
- Currency amounts should be numbers without formatting (e.g., 15000.50 not "$15,000.50")
- Extract ALL claims shown in the document

This is for internal brokerage operations. All outputs require review by licensed insurance professionals before use.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this loss run document and extract all claim data:\n\n${documentText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_loss_run_data",
              description: "Extract structured data from a loss run document",
              parameters: LOSS_RUN_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_loss_run_data" } },
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
          JSON.stringify({ success: false, error: "AI usage limit reached. Please add credits to continue." }),
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

    if (!toolCall || toolCall.function.name !== "extract_loss_run_data") {
      console.error("Unexpected AI response format:", aiResponse);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to extract structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
