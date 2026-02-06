import { supabase } from "@/integrations/supabase/client";

export interface LossRunClaim {
  claim_number: string | null;
  date_of_loss: string | null;
  description: string | null;
  paid_amount: number | null;
  reserved_amount: number | null;
  incurred_amount: number | null;
  status: "open" | "closed" | null;
}

export interface LossRunDebug {
  claim_rows_detected: number;
  row_anchors: string[];
  notes: string;
}

export interface LossRunData {
  claims: LossRunClaim[];
  _debug?: LossRunDebug;
}

export interface ParseLossRunResponse {
  success: boolean;
  data?: LossRunData;
  error?: string;
}

export async function parseLossRunDocument(documentText: string): Promise<ParseLossRunResponse> {
  const { data, error } = await supabase.functions.invoke("parse-loss-run", {
    body: { documentText },
  });

  if (error) {
    console.error("Edge function error:", error);
    return { success: false, error: error.message };
  }

  return data as ParseLossRunResponse;
}
