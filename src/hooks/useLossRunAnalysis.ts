import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface YearlyBreakdown {
  year: string;
  claims: number;
  total_incurred: number;
  open_claims: number;
}

export interface LossRunAnalysis {
  id: string;
  document_id: string;
  request_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  policy_period: string | null;
  carrier_name: string | null;
  total_claims: number | null;
  open_claims: number | null;
  closed_claims: number | null;
  total_incurred: number | null;
  total_paid: number | null;
  total_reserved: number | null;
  largest_claim_amount: number | null;
  largest_claim_description: string | null;
  largest_claim_date: string | null;
  trend: "increasing" | "decreasing" | "stable" | "insufficient_data" | null;
  yearly_breakdown: YearlyBreakdown[] | null;
  risk_observations: string[] | null;
  summary: string | null;
  created_at: string;
  analyzed_at: string | null;
}

export function useDocumentAnalysis(documentId: string | null) {
  return useQuery({
    queryKey: ["loss_run_analysis", documentId],
    queryFn: async () => {
      if (!documentId) return null;

      const { data, error } = await supabase
        .from("loss_run_analyses")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data as unknown as LossRunAnalysis | null;
    },
    enabled: !!documentId,
    // Poll every 3 seconds while processing
    refetchInterval: (query) => {
      const data = query.state.data as LossRunAnalysis | null;
      if (data?.status === "processing" || data?.status === "pending") return 3000;
      return false;
    },
  });
}

export function useAnalyzeDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ documentId, requestId }: { documentId: string; requestId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-loss-run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ documentId, requestId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loss_run_analysis", variables.documentId] });
      toast({
        title: "Analysis Started",
        description: "Claude is reading the loss run. This takes about 15 seconds.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
