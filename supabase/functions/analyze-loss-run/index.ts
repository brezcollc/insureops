import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://insureopsio.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_PROMPT = `You are an expert insurance analyst specializing in loss run analysis for commercial insurance brokerages.

You have been given a loss run document. Extract and analyze the data, then return a JSON object with EXACTLY this structure:

{
  "policy_period": "string - the policy period covered (e.g. '01/01/2020 - 12/31/2024')",
  "carrier_name": "string - the insurance carrier name if visible, or null",
  "total_claims": number - total number of claims across all years,
  "open_claims": number - number of currently open/pending claims,
  "closed_claims": number - number of closed claims,
  "total_incurred": number - total incurred losses in dollars (paid + reserved), no commas or symbols,
  "total_paid": number - total paid losses in dollars, or null if not shown,
  "total_reserved": number - total reserved/outstanding in dollars, or null if not shown,
  "largest_claim_amount": number - dollar amount of the single largest claim, or null if not determinable,
  "largest_claim_description": "string - brief description of the largest claim, or null",
  "largest_claim_date": "string - date of loss for largest claim, or null",
  "trend": "increasing" | "decreasing" | "stable" | "insufficient_data" - based on claim frequency and severity over time,
  "yearly_breakdown": [
    {
      "year": "string - year (e.g. '2024')",
      "claims": number - number of claims that year,
      "total_incurred": number - total incurred that year,
      "open_claims": number - open claims from that year, or 0
    }
  ],
  "risk_observations": [
    "string - each entry is one specific observation about risk, trends, or notable claims"
  ],
  "summary": "string - 2-3 sentence professional narrative summary of the loss history suitable for an underwriter submission"
}

IMPORTANT RULES:
- All dollar amounts must be plain numbers with no commas, dollar signs, or text (e.g. 45000 not $45,000)
- If a field cannot be determined from the document, use null (not 0, not "unknown")
- yearly_breakdown should be sorted oldest to newest
- risk_observations should be 3-5 specific, actionable observations
- The summary should be professional and concise, suitable for an underwriting submission
- Return ONLY the JSON object, no other text`;

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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI analysis service not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authenticate user
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { documentId, requestId } = await req.json();

    if (!documentId || !requestId) {
      return new Response(
        JSON.stringify({ error: "documentId and requestId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch the document record
    const { data: document, error: docError } = await supabase
      .from("loss_run_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only analyze PDFs
    if (document.mime_type !== "application/pdf" && !document.file_name.toLowerCase().endsWith(".pdf")) {
      return new Response(
        JSON.stringify({ error: "Only PDF documents can be analyzed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if analysis already exists and is completed
    const { data: existingAnalysis } = await supabase
      .from("loss_run_analyses")
      .select("id, status")
      .eq("document_id", documentId)
      .eq("status", "completed")
      .single();

    if (existingAnalysis) {
      return new Response(
        JSON.stringify({ success: true, analysisId: existingAnalysis.id, cached: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for existing analysis record for this document
    const { data: existingRecord } = await supabase
      .from("loss_run_analyses")
      .select("id")
      .eq("document_id", documentId)
      .limit(1)
      .maybeSingle();

    let analysisRecord: { id: string };

    if (existingRecord) {
      // Update existing record to reprocess
      const { data: updated, error: updateErr } = await supabase
        .from("loss_run_analyses")
        .update({ status: "processing", error_message: null })
        .eq("id", existingRecord.id)
        .select("id")
        .single();
      if (updateErr || !updated) {
        console.error("Failed to update analysis record:", updateErr);
        return new Response(
          JSON.stringify({ error: "Failed to start analysis" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      analysisRecord = updated;
    } else {
      // Create new record
      const { data: inserted, error: insertErr } = await supabase
        .from("loss_run_analyses")
        .insert({
          document_id: documentId,
          request_id: requestId,
          organization_id: document.organization_id,
          status: "processing",
        })
        .select("id")
        .single();
      if (insertErr || !inserted) {
        console.error("Failed to create analysis record:", insertErr);
        return new Response(
          JSON.stringify({ error: "Failed to start analysis" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      analysisRecord = inserted;
    }

    // Download the PDF from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("loss-run-documents")
      .download(document.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("loss_run_analyses")
        .update({ status: "failed", error_message: "Failed to download document" })
        .eq("id", analysisRecord.id);

      return new Response(
        JSON.stringify({ error: "Failed to download document for analysis" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Convert to base64 for Claude
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Pdf = btoa(binary);

    // Send to Claude API with PDF document block
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Pdf,
                },
              },
              {
                type: "text",
                text: ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);

      await supabase
        .from("loss_run_analyses")
        .update({ status: "failed", error_message: `AI analysis failed: ${claudeResponse.status}` })
        .eq("id", analysisRecord.id);

      return new Response(
        JSON.stringify({ error: "AI analysis failed. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const claudeResult = await claudeResponse.json();
    const rawText = claudeResult.content?.[0]?.text || "";

    // Parse the JSON response from Claude
    let parsed: Record<string, any>;
    try {
      // Strip any markdown code blocks if Claude wrapped the JSON
      const cleaned = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", rawText);
      await supabase
        .from("loss_run_analyses")
        .update({ status: "failed", error_message: "Failed to parse AI response" })
        .eq("id", analysisRecord.id);

      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis response" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Save structured results to database
    const { error: updateError } = await supabase
      .from("loss_run_analyses")
      .update({
        status: "completed",
        analyzed_at: new Date().toISOString(),
        policy_period: parsed.policy_period ?? null,
        carrier_name: parsed.carrier_name ?? null,
        total_claims: parsed.total_claims ?? null,
        open_claims: parsed.open_claims ?? null,
        closed_claims: parsed.closed_claims ?? null,
        total_incurred: parsed.total_incurred ?? null,
        total_paid: parsed.total_paid ?? null,
        total_reserved: parsed.total_reserved ?? null,
        largest_claim_amount: parsed.largest_claim_amount ?? null,
        largest_claim_description: parsed.largest_claim_description ?? null,
        largest_claim_date: parsed.largest_claim_date ?? null,
        trend: parsed.trend ?? "insufficient_data",
        yearly_breakdown: parsed.yearly_breakdown ?? null,
        risk_observations: parsed.risk_observations ?? null,
        summary: parsed.summary ?? null,
      })
      .eq("id", analysisRecord.id);

    if (updateError) {
      console.error("Failed to save analysis:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save analysis results" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analysisId: analysisRecord.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in analyze-loss-run function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during analysis" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
