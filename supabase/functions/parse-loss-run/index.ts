/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOSS_RUN_SCHEMA = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim_number: { type: ["string", "null"], description: "Claim number exactly as written in the document, or null if not found" },
          date_of_loss: { type: ["string", "null"], description: "Date of loss (YYYY-MM-DD format) exactly as shown, or null if not found" },
          description: { type: ["string", "null"], description: "Description verbatim from document, or null if not found" },
          paid_amount: { type: ["number", "null"], description: "Paid amount as shown (0 if explicitly $0), or null if not shown" },
          reserved_amount: { type: ["number", "null"], description: "Reserved amount as shown (0 if explicitly $0), or null if not shown" },
          incurred_amount: { type: ["number", "null"], description: "Incurred amount as shown (0 if explicitly $0), or null if not shown" },
          status: { type: ["string", "null"], enum: ["open", "closed", null], description: "Status exactly as indicated, or null if unclear" },
        },
        additionalProperties: false,
      },
    },
    _debug: {
      type: "object",
      properties: {
        claims_table_detected: { type: "boolean", description: "Whether a claims table section was found in the document" },
        claim_rows_detected: { type: "number", description: "Number of claim rows detected (excluding totals/summary)" },
        evidence_map: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claim_index: { type: "number" },
              claim_number_evidence: { type: ["string", "null"], description: "Verbatim text from document for claim number" },
              date_of_loss_evidence: { type: ["string", "null"], description: "Verbatim text from document for date" },
              paid_amount_evidence: { type: ["string", "null"], description: "Verbatim text from document for paid amount" },
              reserved_amount_evidence: { type: ["string", "null"], description: "Verbatim text from document for reserved" },
              incurred_amount_evidence: { type: ["string", "null"], description: "Verbatim text from document for incurred" },
              description_evidence: { type: ["string", "null"], description: "Verbatim text from document for description" },
              status_evidence: { type: ["string", "null"], description: "Verbatim text from document for status" },
            },
            additionalProperties: false,
          },
        },
      },
      required: ["claims_table_detected", "claim_rows_detected", "evidence_map"],
      additionalProperties: false,
    },
  },
  required: ["claims", "_debug"],
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

    const systemPrompt = `You are an insurance loss run document parser with ZERO TOLERANCE for hallucination.

CRITICAL RULE: EVIDENCE-BASED EXTRACTION ONLY
You must NEVER invent, guess, assume, or fabricate any data. Every extracted value MUST have exact textual evidence from the document.

HARD STOP RULES (NON-NEGOTIABLE):

1. EVIDENCE REQUIREMENT:
   - For EVERY field you extract, you MUST be able to point to exact text in the document
   - If you cannot find verbatim evidence for a field, that field MUST be null
   - If you cannot find a clear claim row with at least a claim number OR clear row boundary, do NOT create a claim

2. NO-CLAIMS HANDLING:
   - If the document states "no claims", "no losses", "loss-free", or similar, return: { "claims": [], "_debug": {...} }
   - If the claims table is empty or contains only headers/totals, return empty claims array
   - NEVER generate a placeholder claim. NEVER invent data.

3. ZERO-DOLLAR VALUES:
   - If a value is explicitly shown as $0, 0, 0.00, or similar, extract as 0 (numeric zero)
   - If a value is blank, missing, or not shown, extract as null (NOT zero)
   - Zero and null are NOT the same. Zero means explicitly shown as zero. Null means not present.

4. TABLE-FIRST PARSING:
   - ONLY extract claim data from the claims table section
   - IGNORE policy info blocks, headers, narrative summaries, footer text
   - IGNORE rows labeled "Total", "Totals", "Summary", "Grand Total"
   - Each claim must come from a distinct row in the claims table

5. DESCRIPTION EXTRACTION (if applicable):
   - Primary: Extract from columns labeled "Description", "Loss Description", or "Claim Description"
   - Secondary: If no explicit column, look for unlabeled narrative text column with sentences
   - NEVER extract from columns labeled: "Cause", "Type", "Coverage", "Class", "Nature", "Status"
   - If ambiguous, return null for description

6. FORMAT REQUIREMENTS:
   - Dates: YYYY-MM-DD format (extract exactly as shown, convert format only)
   - Currency: Numbers only, no symbols (e.g., 15000.50 not "$15,000.50")
   - Status: "open" or "closed" only, or null if unclear

7. DEBUG EVIDENCE:
   - For each claim, provide the exact text evidence from the document in the _debug.evidence_map
   - evidence_map entries must contain the verbatim text you found, or null if not found

VALIDATION CHECK (before returning):
- For each claim: Can I quote the exact text from the document for each non-null field?
- If NO: Set that field to null
- If I cannot justify ANY claim row from the document: Return empty claims array

This is for internal brokerage operations. All outputs require review by licensed insurance professionals before use.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this loss run document. Extract ONLY what is explicitly present. If no claims exist, return an empty claims array. NEVER fabricate data.\n\nDocument text:\n\n${documentText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_loss_run_data",
              description: "Extract structured claim data from a loss run document. Only extract data with explicit textual evidence. Return empty claims array if no claims exist.",
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
