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
          claim_number: { type: ["string", "null"], description: "Claim number exactly as written, or null if not found" },
          date_of_loss: { type: ["string", "null"], description: "Date of loss in YYYY-MM-DD format, or null if not found" },
          description: { type: ["string", "null"], description: "Description verbatim from document, or null if not found" },
          paid_amount: { type: ["number", "null"], description: "Paid amount as number, or null if not shown" },
          reserved_amount: { type: ["number", "null"], description: "Reserved amount as number, or null if not shown" },
          incurred_amount: { type: ["number", "null"], description: "Incurred amount as shown (never calculated), or null if not shown" },
          status: { type: ["string", "null"], enum: ["open", "closed", null], description: "Status as indicated, or null if unclear" },
        },
        additionalProperties: false,
      },
    },
    _debug: {
      type: "object",
      properties: {
        claim_rows_detected: { type: "number", description: "Number of valid claim rows found (excluding totals/headers)" },
        row_anchors: { 
          type: "array", 
          items: { type: "string" },
          description: "Verbatim text anchors proving each row exists (e.g., claim numbers or unique identifiers)"
        },
        notes: { type: "string", description: "Brief explanation of parsing decisions" },
      },
      required: ["claim_rows_detected", "row_anchors", "notes"],
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

    const systemPrompt = `You are a TRANSCRIPTION ENGINE for insurance loss run documents. You extract ONLY what exists. You NEVER invent data.

=== ABSOLUTE RULES ===
1. NEVER invent claim rows that don't exist in the document
2. NEVER invent field values  
3. claims: [] is valid ONLY when explicitly stated or no claim structures exist
4. Under-extraction is acceptable. Fabrication is FORBIDDEN.

=== PARSING STAGES (FOLLOW IN ORDER) ===

STAGE 1 — CLAIM ROW DETECTION (PERMISSIVE)
Scan the document for individual claim rows. Be INCLUSIVE when detecting rows.

A claim row MUST be created if ANY of these conditions are true:

1. TABLE DETECTION: A table contains repeated structured lines beneath headers that imply claims
   - Headers containing: Loss Date, Paid, Reserve, Incurred, Claim, Status, Date of Loss, Amount, etc.
   - Even if claim number column is missing or abbreviated
   - Each data row under such headers = one claim row

2. COLUMN ALIGNMENT DETECTION: Multiple rows appear with similar column alignment and patterns
   - Dates aligned vertically in one column
   - Monetary values aligned in columns
   - Repeated structural patterns across rows

3. NARRATIVE BLOCK DETECTION: Repeated narrative blocks with similar structure
   - Sequences like: Date → Description → Amounts appearing multiple times
   - Each repeated block = one claim row
   - Even if "Claim Number" is abbreviated or missing

INVALID (do NOT extract as claim rows):
- Total/Summary rows (e.g., "Total Incurred: $50,000", "Subtotal", "Grand Total")
- Header rows themselves
- Policy information sections
- Blank rows

CRITICAL — SUBTOTAL/TOTAL EXCLUSION:
Any row containing these terms must NEVER be treated as a claim row:
- "Total", "Subtotal", "Grand Total", "Sum", "Policy Total"
- "Total Incurred", "Total Paid", "Total Reserved"
- Any row that aggregates values from other rows
These rows must be completely excluded from claim extraction.

CRITICAL CLARIFICATION — These do NOT indicate zero claims:
- "No paid losses" → claims may still exist with $0 paid
- "No claims exceeding deductible" → claims exist, just below threshold
- "$0 incurred" or "$0 paid" → these ARE valid claim rows with zero amounts
- "Loss-free period" for a date range → check if claims exist outside that range

ONLY return claims: [] when:
- Explicit statement: "No claims reported", "Zero claims", "No losses on record"
- Document contains ONLY headers with no data rows beneath
- No claim-like structures exist anywhere in the document

ROW CONFIDENCE RULE:
- If there is reasonable evidence of a repeated claim-like structure → CREATE the row
- If structure appears only once and cannot be clearly identified → do NOT create

IF zero valid claim rows detected AND no explicit no-claims statement → Return { "claims": [], "_debug": { notes: "No claim structures found" } }

STAGE 2 — ROW ANCHORING
For each detected claim row, identify a ROW ANCHOR that proves the row exists.

Valid anchors (in order of preference):
- Claim number text (e.g., "CLM-2024-001", "2024-0042")
- Date + unique identifier combination
- Row number + distinctive value (e.g., "Row 3: $15,000 on 01/15/2024")
- Unique description text snippet

IF a row cannot be anchored → Do NOT create a claim for it.
Record each anchor in _debug.row_anchors array.

STAGE 3 — FIELD EXTRACTION (VERBATIM ONLY)
For each anchored row, extract fields ONLY from that row's data.

=== NUMERIC FIELD EXTRACTION RULES (NON-NEGOTIABLE) ===

RULE 1: HEADER-ANCHORED EXTRACTION ONLY
A numeric value may ONLY populate paid_amount, reserved_amount, or incurred_amount IF:
- The column header EXPLICITLY references that concept
- Valid headers for paid_amount: "Paid", "Loss Paid", "Paid Loss", "Amount Paid", "Paid Amount"
- Valid headers for reserved_amount: "Reserve", "Reserved", "Outstanding", "Case Reserve", "Open Reserve"
- Valid headers for incurred_amount: "Incurred", "Total Incurred", "Incurred Loss"

If the header is:
- Ambiguous (e.g., "Amount", "Value", "Loss")
- Merged with other columns
- Missing or unclear
→ Set the field to NULL. Do NOT guess or shift values from nearby columns.

RULE 2: SINGLE-COLUMN EXTRACTION ONLY
- Do NOT sum multiple columns (e.g., do not add Claim + Medical + Expense)
- Do NOT combine separate columns into one field
- Extract ONLY the single column that explicitly matches the target field name
- If multiple columns could match (e.g., two "Paid" columns), return NULL for that field

RULE 3: SUBTOTAL/TOTAL EXCLUSION (ENFORCED)
- Rows containing "Total", "Subtotal", "Grand Total", "Sum" must NEVER populate claim fields
- If you detect a summary row, SKIP IT ENTIRELY — do not extract any values from it
- Totals appearing at the bottom of tables are NOT claim rows

RULE 4: ZERO VALUE HANDLING
- $0.00, $0, or 0 is a VALID numeric value if it appears in a valid, header-matched column
- Absence of a value (empty cell, dash, N/A) = NULL, not 0
- "No payment" or similar text = NULL, not 0

=== OTHER FIELD RULES ===
- claim_number: Exact text as shown, or null if not present
- date_of_loss: Convert to YYYY-MM-DD format, or null if not present
- description: Verbatim text from Description column OR per-row narrative, or null
- status: "open" or "closed" as indicated, or null if unclear

DESCRIPTION EXTRACTION:
1. If explicit "Description" column exists → use it
2. Else if per-row narrative clearly tied to that row → use it
3. Else → return null (do NOT guess)

=== DEBUG OUTPUT ===
Always include _debug with:
- claim_rows_detected: Count of valid anchored rows
- row_anchors: Array of verbatim anchor text for each claim
- notes: Brief explanation (e.g., "Found 3 data rows in claims table with Loss Date/Paid/Reserve columns")

=== PROHIBITIONS ===
- Do NOT guess or infer any values
- Do NOT create placeholder claims
- Do NOT calculate incurred from paid + reserved
- Do NOT satisfy schema by fabricating
- Do NOT extract from headers, totals, or policy blocks
- Do NOT shift values between columns when headers don't match`;

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
          { role: "user", content: `Parse this loss run document using the 3-stage process. Extract ONLY what exists. If no claims exist, return claims: [].

Document text:

${documentText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_loss_run_data",
              description: "Extract claim data from loss run document. Only include claims with valid row anchors. Return empty claims array if no valid claim rows exist.",
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
    
    // Validation: Ensure row_anchors count matches claims count
    const claimsCount = extractedData.claims?.length || 0;
    const anchorsCount = extractedData._debug?.row_anchors?.length || 0;
    
    if (claimsCount !== anchorsCount) {
      console.warn(`Anchor mismatch: ${claimsCount} claims but ${anchorsCount} anchors`);
      // Trim claims to match anchors if there are fewer anchors
      if (anchorsCount < claimsCount) {
        extractedData.claims = extractedData.claims.slice(0, anchorsCount);
        extractedData._debug.notes += ` [Trimmed ${claimsCount - anchorsCount} unanchored claims]`;
      }
    }

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
