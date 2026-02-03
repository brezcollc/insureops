import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LossRunRequest } from "@/hooks/useLossRunRequests";

export function useLossRunsByClient(clientId: string | null) {
  return useQuery({
    queryKey: ["loss_run_requests_by_client", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("loss_run_requests")
        .select(`
          *,
          clients (*),
          carriers (*)
        `)
        .eq("client_id", clientId)
        .order("request_date", { ascending: false });
      
      if (error) throw error;
      return data as LossRunRequest[];
    },
    enabled: !!clientId,
  });
}
