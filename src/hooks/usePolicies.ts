import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Carrier, CoverageType } from "@/hooks/useLossRunRequests";

export interface Policy {
  id: string;
  client_id: string;
  carrier_id: string;
  policy_number: string;
  coverage_type: CoverageType;
  effective_date: string | null;
  expiration_date: string | null;
  carrier_email: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  carriers?: Carrier;
}

export interface CreatePolicyInput {
  client_id: string;
  carrier_id: string;
  policy_number: string;
  coverage_type: CoverageType;
  effective_date?: string;
  expiration_date?: string;
  carrier_email: string;
  notes?: string;
}

export interface UpdatePolicyInput extends Partial<Omit<CreatePolicyInput, "client_id">> {
  id: string;
}

export function usePoliciesByClient(clientId: string | null) {
  return useQuery({
    queryKey: ["policies", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("policies")
        .select(`
          *,
          carriers (*)
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Policy[];
    },
    enabled: !!clientId,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreatePolicyInput) => {
      const { data, error } = await supabase
        .from("policies")
        .insert({
          client_id: input.client_id,
          carrier_id: input.carrier_id,
          policy_number: input.policy_number,
          coverage_type: input.coverage_type,
          effective_date: input.effective_date || null,
          expiration_date: input.expiration_date || null,
          carrier_email: input.carrier_email,
          notes: input.notes || null,
        })
        .select(`
          *,
          carriers (*)
        `)
        .single();

      if (error) throw error;
      return data as Policy;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["policies", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["clients_with_stats"] });
      toast({
        title: "Policy Added",
        description: "New policy has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add policy",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdatePolicyInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("policies")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          carriers (*)
        `)
        .single();

      if (error) throw error;
      return data as Policy;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["policies", data.client_id] });
      toast({
        title: "Policy Updated",
        description: "Policy details have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update policy",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from("policies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["policies", data.clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients_with_stats"] });
      toast({
        title: "Policy Deleted",
        description: "Policy has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete policy",
        variant: "destructive",
      });
    },
  });
}
