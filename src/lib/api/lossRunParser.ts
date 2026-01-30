import { supabase } from "@/integrations/supabase/client";

export interface LossRunClaim {
  claim_number: string;
  claimant_name: string | null;
  date_of_loss: string | null;
  date_reported: string | null;
  claim_status: string;
  cause_of_loss: string | null;
  injury_type: string | null;
  body_part: string | null;
  paid_indemnity: number | null;
  paid_medical: number | null;
  paid_expense: number | null;
  total_paid: number | null;
  reserved_indemnity: number | null;
  reserved_medical: number | null;
  reserved_expense: number | null;
  total_reserved: number | null;
  total_incurred: number | null;
  subrogation: number | null;
  notes: string | null;
}

export interface LossRunDocumentInfo {
  carrier_name: string;
  policy_number: string;
  insured_name: string;
  report_date: string | null;
  policy_effective_date: string | null;
  policy_expiration_date: string | null;
  line_of_business: string | null;
}

export interface LossRunSummary {
  total_claims: number | null;
  open_claims: number | null;
  closed_claims: number | null;
  total_paid: number | null;
  total_reserved: number | null;
  total_incurred: number | null;
  valuation_date: string | null;
}

export interface LossRunData {
  document_info: LossRunDocumentInfo;
  claims: LossRunClaim[];
  summary?: LossRunSummary;
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
