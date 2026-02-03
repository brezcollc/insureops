import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  industry: string | null;
  status: string;
  internal_notes: string | null;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithStats extends Client {
  policy_count: number;
  open_request_count: number;
}

export interface CreateClientInput {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  industry?: string;
  internal_notes?: string;
  renewal_date?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string;
  status?: string;
}

export function useClients(includeArchived = false) {
  return useQuery({
    queryKey: ["clients", { includeArchived }],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("name");
      
      if (!includeArchived) {
        query = query.or("status.eq.active,status.is.null");
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useClientsWithStats(includeArchived = false) {
  return useQuery({
    queryKey: ["clients_with_stats", { includeArchived }],
    queryFn: async () => {
      // Fetch clients
      let clientsQuery = supabase
        .from("clients")
        .select("*")
        .order("name");
      
      if (!includeArchived) {
        clientsQuery = clientsQuery.or("status.eq.active,status.is.null");
      }
      
      const { data: clients, error: clientsError } = await clientsQuery;
      if (clientsError) throw clientsError;

      // Fetch policy counts
      const { data: policies, error: policiesError } = await supabase
        .from("policies")
        .select("client_id");
      
      if (policiesError) throw policiesError;

      // Fetch open loss run request counts
      const { data: requests, error: requestsError } = await supabase
        .from("loss_run_requests")
        .select("client_id, status")
        .in("status", ["requested", "follow_up_sent"]);
      
      if (requestsError) throw requestsError;

      // Map counts to clients
      const policyCountMap = new Map<string, number>();
      policies?.forEach((p) => {
        const count = policyCountMap.get(p.client_id) || 0;
        policyCountMap.set(p.client_id, count + 1);
      });

      const requestCountMap = new Map<string, number>();
      requests?.forEach((r) => {
        const count = requestCountMap.get(r.client_id) || 0;
        requestCountMap.set(r.client_id, count + 1);
      });

      const clientsWithStats: ClientWithStats[] = (clients || []).map((client) => ({
        ...client,
        status: client.status || "active",
        policy_count: policyCountMap.get(client.id) || 0,
        open_request_count: requestCountMap.get(client.id) || 0,
      }));

      return clientsWithStats;
    },
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: input.name,
          contact_email: input.contact_email || null,
          contact_phone: input.contact_phone || null,
          address: input.address || null,
          industry: input.industry || null,
          internal_notes: input.internal_notes || null,
          renewal_date: input.renewal_date || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients_with_stats"] });
      toast({
        title: "Client Created",
        description: "New client has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateClientInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients_with_stats"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
      toast({
        title: "Client Updated",
        description: "Client details have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update client",
        variant: "destructive",
      });
    },
  });
}

export function useArchiveClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("clients")
        .update({ status: "archived" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients_with_stats"] });
      toast({
        title: "Client Archived",
        description: "Client has been archived and hidden from active list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive client",
        variant: "destructive",
      });
    },
  });
}

export function useRestoreClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("clients")
        .update({ status: "active" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients_with_stats"] });
      toast({
        title: "Client Restored",
        description: "Client has been restored to active status.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore client",
        variant: "destructive",
      });
    },
  });
}
