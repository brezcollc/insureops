import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Client {
  id: string;
  name: string;
  client_code: string | null;
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
  reviewed_request_count: number;
  total_request_count: number;
  last_activity: string | null;
}

export interface CreateClientInput {
  name: string;
  client_code?: string;
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

export interface PaginatedClientsResult {
  clients: ClientWithStats[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface ClientsQueryParams {
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  sortBy?: "recent" | "alphabetical" | "pending" | "client_code";
}

export function useClientsWithStats(params: ClientsQueryParams = {}) {
  const { 
    includeArchived = false, 
    page = 1, 
    pageSize = 15, 
    searchQuery = "",
    sortBy = "recent"
  } = params;

  return useQuery({
    queryKey: ["clients_with_stats", { includeArchived, page, pageSize, searchQuery, sortBy }],
    queryFn: async (): Promise<PaginatedClientsResult> => {
      // First, get total count for pagination
      let countQuery = supabase
        .from("clients")
        .select("id", { count: "exact", head: true });
      
      if (!includeArchived) {
        countQuery = countQuery.or("status.eq.active,status.is.null");
      }
      
      if (searchQuery) {
        const query = `%${searchQuery}%`;
        countQuery = countQuery.or(`name.ilike.${query},client_code.ilike.${query},industry.ilike.${query},contact_email.ilike.${query}`);
      }
      
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Fetch paginated clients
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let clientsQuery = supabase
        .from("clients")
        .select("*")
        .range(from, to);
      
      if (!includeArchived) {
        clientsQuery = clientsQuery.or("status.eq.active,status.is.null");
      }
      
      if (searchQuery) {
        const query = `%${searchQuery}%`;
        clientsQuery = clientsQuery.or(`name.ilike.${query},client_code.ilike.${query},industry.ilike.${query},contact_email.ilike.${query}`);
      }
      
      // Apply sorting at database level for alphabetical and client_code
      if (sortBy === "alphabetical") {
        clientsQuery = clientsQuery.order("name", { ascending: true });
      } else if (sortBy === "client_code") {
        clientsQuery = clientsQuery.order("client_code", { ascending: true, nullsFirst: false });
      } else {
        clientsQuery = clientsQuery.order("updated_at", { ascending: false });
      }
      
      const { data: clients, error: clientsError } = await clientsQuery;
      if (clientsError) throw clientsError;

      const clientIds = (clients || []).map(c => c.id);
      
      if (clientIds.length === 0) {
        return {
          clients: [],
          totalCount,
          totalPages,
          currentPage: page
        };
      }

      // Fetch policy counts for these clients
      const { data: policies, error: policiesError } = await supabase
        .from("policies")
        .select("client_id")
        .in("client_id", clientIds);
      
      if (policiesError) throw policiesError;

      // Fetch loss run requests for these clients
      const { data: requests, error: requestsError } = await supabase
        .from("loss_run_requests")
        .select("client_id, status, reviewed_at, updated_at, request_date")
        .in("client_id", clientIds);
      
      if (requestsError) throw requestsError;

      // Map counts to clients
      const policyCountMap = new Map<string, number>();
      policies?.forEach((p) => {
        const count = policyCountMap.get(p.client_id) || 0;
        policyCountMap.set(p.client_id, count + 1);
      });

      const openRequestCountMap = new Map<string, number>();
      const reviewedRequestCountMap = new Map<string, number>();
      const totalRequestCountMap = new Map<string, number>();
      const lastActivityMap = new Map<string, string>();
      
      requests?.forEach((r) => {
        const total = totalRequestCountMap.get(r.client_id) || 0;
        totalRequestCountMap.set(r.client_id, total + 1);
        
        if (r.reviewed_at) {
          const reviewed = reviewedRequestCountMap.get(r.client_id) || 0;
          reviewedRequestCountMap.set(r.client_id, reviewed + 1);
        } else {
          const open = openRequestCountMap.get(r.client_id) || 0;
          openRequestCountMap.set(r.client_id, open + 1);
        }

        const activityDate = r.updated_at || r.request_date;
        const currentLast = lastActivityMap.get(r.client_id);
        if (!currentLast || activityDate > currentLast) {
          lastActivityMap.set(r.client_id, activityDate);
        }
      });

      let clientsWithStats: ClientWithStats[] = (clients || []).map((client) => ({
        ...client,
        status: client.status || "active",
        policy_count: policyCountMap.get(client.id) || 0,
        open_request_count: openRequestCountMap.get(client.id) || 0,
        reviewed_request_count: reviewedRequestCountMap.get(client.id) || 0,
        total_request_count: totalRequestCountMap.get(client.id) || 0,
        last_activity: lastActivityMap.get(client.id) || client.updated_at || null,
      }));

      // Client-side sort for "recent" and "pending" which need computed fields
      if (sortBy === "recent") {
        clientsWithStats.sort((a, b) => {
          const aDate = a.last_activity || a.updated_at || a.created_at;
          const bDate = b.last_activity || b.updated_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
      } else if (sortBy === "pending") {
        clientsWithStats.sort((a, b) => b.open_request_count - a.open_request_count);
      }

      return {
        clients: clientsWithStats,
        totalCount,
        totalPages,
        currentPage: page
      };
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
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          organization_id: organizationId,
          name: input.name,
          client_code: input.client_code || null,
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
