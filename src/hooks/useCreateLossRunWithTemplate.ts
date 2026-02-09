import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LossRunRequest, CoverageType } from "@/hooks/useLossRunRequests";

interface CreateLossRunWithTemplateInput {
  client_id: string;
  carrier_id: string;
  policy_number: string;
  coverage_type: CoverageType;
  policy_effective_date?: string;
  policy_expiration_date?: string;
  notes?: string;
  customSubject: string;
  customBody: string;
  templateId: string;
}

export function useCreateLossRunWithTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateLossRunWithTemplateInput) => {
      // First, create the request
      const { data: request, error: requestError } = await supabase
        .from("loss_run_requests")
        .insert({
          client_id: input.client_id,
          carrier_id: input.carrier_id,
          policy_number: input.policy_number,
          coverage_type: input.coverage_type,
          policy_effective_date: input.policy_effective_date || null,
          policy_expiration_date: input.policy_expiration_date || null,
          notes: input.notes || null,
          status: "requested",
        })
        .select(`
          *,
          clients (*),
          carriers (*)
        `)
        .single();

      if (requestError) throw requestError;

      const typedRequest = request as LossRunRequest;

      // Send email via external resend-email endpoint
      const policyPeriod = [
        typedRequest.policy_effective_date,
        typedRequest.policy_expiration_date,
      ]
        .filter(Boolean)
        .join(" to ") || "N/A";

      const response = await fetch(
        "https://wtgihcskwpneynwbwcyj.supabase.co/functions/v1/resend-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carrierEmail: typedRequest.carriers?.loss_run_email,
            insuredName: typedRequest.clients?.name || "Unknown Client",
            policyNumber: typedRequest.policy_number,
            policyPeriod,
            lineOfBusiness: typedRequest.coverage_type,
            yearsRequested: 5,
            brokerName: "Insurance Operations Team",
            agencyName: "Acme Insurance Group",
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        console.error("Email send error:", errBody);
        toast({
          title: "Request Created",
          description: "Request created but email send failed. You may need to resend.",
          variant: "destructive",
        });
      }

      return typedRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests_by_client"] });
    },
  });
}
