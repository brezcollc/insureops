import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AgentDecision {
  action: "send_follow_up" | "parse_document" | "generate_summary" | "update_status" | "add_note" | "wait";
  reason: string;
}

export interface AgentResult {
  executed: boolean;
  details: string;
}

export type TriggerType = "manual" | "document_upload" | "follow_up" | "batch";

export interface AgentResponse {
  success: boolean;
  decision?: AgentDecision;
  result?: AgentResult;
  error?: string;
  triggerType?: TriggerType;
  locked?: boolean;
}

interface AgentActionParams {
  requestId: string;
  triggerType?: TriggerType;
  silent?: boolean;
}

export function useAgentAction(options?: { silent?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: string | AgentActionParams): Promise<AgentResponse> => {
      const requestId = typeof params === "string" ? params : params.requestId;
      const triggerType = typeof params === "string" ? "manual" : (params.triggerType || "manual");

      const { data, error } = await supabase.functions.invoke("process-agent-action", {
        body: { requestId, triggerType },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as AgentResponse;
    },
    onSuccess: (data, params) => {
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      queryClient.invalidateQueries({ queryKey: ["email_logs"] });
      queryClient.invalidateQueries({ queryKey: ["agent_action_logs"] });

      const silent = typeof params === "string" ? options?.silent : params.silent;
      if (silent) return;

      if (data.success && data.decision) {
        const actionLabel = data.locked
          ? "Request Locked"
          : data.decision.action === "wait" 
          ? "No action needed" 
          : data.decision.action.replace("_", " ");

        const triggerLabel = data.triggerType === "document_upload" 
          ? " (auto: document upload)"
          : data.triggerType === "follow_up"
          ? " (auto: scheduled)"
          : "";
        
        toast({
          title: `Agent: ${actionLabel}${triggerLabel}`,
          description: data.decision.reason,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Agent Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to fetch action logs for a request
export function useAgentActionLogs(requestId: string | null) {
  const queryClient = useQueryClient();
  
  return {
    data: null, // Will be implemented when needed for UI display
    isLoading: false,
  };
}
