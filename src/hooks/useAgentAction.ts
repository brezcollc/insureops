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

export interface AgentResponse {
  success: boolean;
  decision?: AgentDecision;
  result?: AgentResult;
  error?: string;
}

export function useAgentAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string): Promise<AgentResponse> => {
      const { data, error } = await supabase.functions.invoke("process-agent-action", {
        body: { requestId },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as AgentResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      queryClient.invalidateQueries({ queryKey: ["email_logs"] });

      if (data.success && data.decision) {
        const actionLabel = data.decision.action === "wait" 
          ? "No action needed" 
          : data.decision.action.replace("_", " ");
        
        toast({
          title: `Agent: ${actionLabel}`,
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
