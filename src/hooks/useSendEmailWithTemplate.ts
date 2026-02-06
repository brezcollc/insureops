import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { LossRunRequest } from "@/hooks/useLossRunRequests";

interface SendEmailParams {
  request: LossRunRequest;
  customSubject?: string;
  customBody?: string;
  templateId?: string;
}

export function useSendEmailWithTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ request, customSubject, customBody, templateId }: SendEmailParams) => {
      const { error } = await supabase.functions.invoke("send-loss-run-email", {
        body: {
          requestId: request.id,
          clientName: request.clients?.name || "Unknown Client",
          carrierName: request.carriers?.name || "Unknown Carrier",
          carrierEmail: request.carriers?.loss_run_email,
          policyNumber: request.policy_number,
          coverageType: request.coverage_type,
          policyEffectiveDate: request.policy_effective_date,
          policyExpirationDate: request.policy_expiration_date,
          isFollowUp: templateId === "follow_up" || request.status === "follow_up_sent",
          customSubject,
          customBody,
          templateId,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_logs"] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      toast({
        title: "Email Sent",
        description: "Loss run request email has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });
}
