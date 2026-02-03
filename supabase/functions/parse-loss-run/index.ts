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
          claim_number: { type: "string", description: "Claim number exactly as written, or null if not shown" },
          date_of_loss: { type: "string", description: "Date of loss (YYYY-MM-DD format), or null if not shown" },
          description: { type: "string", description: "Description or cause of loss exactly as written, or null if not shown" },
          paid_amount: { type: "number", description: "Total paid amount as a number, or null if not shown" },
          reserved_amount: { type: "number", description: "Total reserved amount as a number, or null if not shown" },
          incurred_amount: { type: "number", description: "Total incurred amount (paid + reserved), or null if not shown" },
          status: { type: "string", enum: ["open", "closed"], description: "Claim status: 'open' or 'closed', or null if unclear" },
        },
        additionalProperties: false,
      },
    },
  },
  required: ["claims"],
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
- Ignore rows labeled "Total", "Totals", or "Summary"

DESCRIPTION EXTRACTION RULES (CRITICAL):

1. PRIMARY RULE - Explicit Description Columns:
   If a column header explicitly contains "Description", "Loss Description", or "Claim Description":
   - Extract description ONLY from that column
   - Use text verbatim exactly as written

2. SECONDARY RULE - Implicit Narrative Columns:
   If NO explicit description column exists:
   - Identify a column containing free-text narrative sentences per claim row
   - This column may be unlabeled or generically labeled (e.g., "Details", "Narrative", blank header)
   - The text typically consists of one or more sentences describing the loss event
   - Extract this narrative text verbatim as the description

3. STRICT EXCLUSIONS - Never extract description from columns labeled:
   - "Cause"
   - "Type"  
   - "Coverage"
   - "Class"
   - "Nature"
   - "Status"
   - Do NOT combine text from multiple columns
   - Do NOT summarize, rephrase, or normalize narrative text

4. AMBIGUITY HANDLING:
   - If multiple columns could plausibly be narrative text: return null for description
   - If narrative text appears to span multiple columns: return null for description

5. NUMERIC ADJACENCY RULE:
   - Do NOT treat numeric columns or totals as narrative
   - Numeric-only fields are never descriptions

6. OUTPUT REQUIREMENTS:
   - Extract description text verbatim, exactly as written
   - Preserve punctuation and sentence structure
   - If no valid narrative text exists per claim row, return null

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
