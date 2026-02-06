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

      // Send the email with custom template content
      const { error: emailError } = await supabase.functions.invoke("send-loss-run-email", {
        body: {
          requestId: typedRequest.id,
          clientName: typedRequest.clients?.name || "Unknown Client",
          carrierName: typedRequest.carriers?.name || "Unknown Carrier",
          carrierEmail: typedRequest.carriers?.loss_run_email,
          policyNumber: typedRequest.policy_number,
          coverageType: typedRequest.coverage_type,
          policyEffectiveDate: typedRequest.policy_effective_date,
          policyExpirationDate: typedRequest.policy_expiration_date,
          isFollowUp: input.templateId === "follow_up",
          customSubject: input.customSubject,
          customBody: input.customBody,
          templateId: input.templateId,
        },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        // Don't throw - request was created, just email failed
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
