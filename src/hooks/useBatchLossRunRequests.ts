import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Policy } from "@/hooks/usePolicies";
import type { LossRunRequest } from "@/hooks/useLossRunRequests";

export interface BatchLossRunInput {
  clientId: string;
  policies: Policy[];
}

export interface BatchLossRunResult {
  created: LossRunRequest[];
  skipped: { policyId: string; reason: string }[];
  emailErrors: string[];
}

export function useBatchLossRunRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, policies }: BatchLossRunInput): Promise<BatchLossRunResult> => {
      const result: BatchLossRunResult = {
        created: [],
        skipped: [],
        emailErrors: [],
      };

      // Check for existing open requests for these policies
      const policyNumbers = policies.map(p => p.policy_number);
      const { data: existingRequests } = await supabase
        .from("loss_run_requests")
        .select("policy_number, status")
        .eq("client_id", clientId)
        .in("policy_number", policyNumbers)
        .in("status", ["requested", "follow_up_sent"]);

      const existingPolicyNumbers = new Set(existingRequests?.map(r => r.policy_number) || []);

      for (const policy of policies) {
        // Skip if there's already an open request for this policy
        if (existingPolicyNumbers.has(policy.policy_number)) {
          result.skipped.push({
            policyId: policy.id,
            reason: "Open request already exists",
          });
          continue;
        }

        try {
          // Create the request
          const { data: request, error: requestError } = await supabase
            .from("loss_run_requests")
            .insert({
              client_id: clientId,
              carrier_id: policy.carrier_id,
              policy_number: policy.policy_number,
              coverage_type: policy.coverage_type,
              policy_effective_date: policy.effective_date || null,
              policy_expiration_date: policy.expiration_date || null,
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
          result.created.push(typedRequest);

          // Send email for this request
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
              isFollowUp: false,
            },
          });

          if (emailError) {
            console.error(`Email send error for policy ${policy.policy_number}:`, emailError);
            result.emailErrors.push(policy.policy_number);
          }
        } catch (error) {
          console.error(`Failed to create request for policy ${policy.policy_number}:`, error);
          result.skipped.push({
            policyId: policy.id,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return result;
    },
    onSuccess: (result, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests_by_client", variables.clientId] });

      // Show appropriate toast
      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;
      const emailErrorCount = result.emailErrors.length;

      if (createdCount > 0 && emailErrorCount === 0) {
        toast({
          title: "Loss Run Requests Created",
          description: `${createdCount} request${createdCount > 1 ? "s" : ""} created and emails sent.${
            skippedCount > 0 ? ` ${skippedCount} skipped (existing open requests).` : ""
          }`,
        });
      } else if (createdCount > 0 && emailErrorCount > 0) {
        toast({
          title: "Requests Created (Some Email Errors)",
          description: `${createdCount} request${createdCount > 1 ? "s" : ""} created. ${emailErrorCount} email${emailErrorCount > 1 ? "s" : ""} failed to send.`,
          variant: "destructive",
        });
      } else if (createdCount === 0 && skippedCount > 0) {
        toast({
          title: "No New Requests Created",
          description: "All selected policies already have open requests.",
          variant: "destructive",
        });
      }
    },
  });
}
