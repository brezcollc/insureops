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

export interface LossRunData {
  claims: LossRunClaim[];
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
