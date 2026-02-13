import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Carrier {
  id: string;
  name: string;
  loss_run_email: string;
  underwriter_email: string | null;
  phone: string | null;
  created_at: string;
}

export type LossRunStatus = "requested" | "follow_up_sent" | "received" | "completed";
export type CoverageType = 
  | "general_liability"
  | "workers_compensation"
  | "commercial_auto"
  | "commercial_property"
  | "professional_liability"
  | "umbrella"
  | "other";

export interface LossRunRequest {
  id: string;
  client_id: string;
  carrier_id: string;
  policy_number: string;
  coverage_type: CoverageType;
  status: LossRunStatus;
  request_date: string;
  policy_effective_date: string | null;
  policy_expiration_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  clients?: Client;
  carriers?: Carrier;
}

export interface EmailLog {
  id: string;
  request_id: string;
  email_type: "initial_request" | "follow_up" | "reminder";
  recipient: string;
  subject: string;
  body: string;
  sent_at: string;
}

export interface CreateLossRunRequestInput {
  client_id: string;
  carrier_id: string;
  policy_number: string;
  coverage_type: CoverageType;
  policy_effective_date?: string;
  policy_expiration_date?: string;
  notes?: string;
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useCarriers() {
  return useQuery({
    queryKey: ["carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carriers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Carrier[];
    },
  });
}

export function useLossRunRequests() {
  return useQuery({
    queryKey: ["loss_run_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loss_run_requests")
        .select(`
          *,
          clients (*),
          carriers (*)
        `)
        .order("request_date", { ascending: false });
      
      if (error) throw error;
      return data as LossRunRequest[];
    },
  });
}

export function useLossRunRequest(id: string | null) {
  return useQuery({
    queryKey: ["loss_run_request", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("loss_run_requests")
        .select(`
          *,
          clients (*),
          carriers (*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as LossRunRequest;
    },
    enabled: !!id,
  });
}

export function useEmailLogs(requestId: string | null) {
  return useQuery({
    queryKey: ["email_logs", requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .eq("request_id", requestId)
        .order("sent_at", { ascending: false });
      
      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!requestId,
  });
}

export function useCreateLossRunRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateLossRunRequestInput) => {
      // First, create the request
      const { data: request, error: requestError } = await supabase
        .from("loss_run_requests")
        .insert({
          organization_id: organizationId,
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

      // Send the email
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
    },
  });
}

export function useUpdateLossRunStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LossRunStatus }) => {
      const { data, error } = await supabase
        .from("loss_run_requests")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (input: { name: string; contact_email?: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          organization_id: organizationId,
          name: input.name,
          contact_email: input.contact_email || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useResendEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: LossRunRequest) => {
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
          isFollowUp: request.status === "follow_up_sent",
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_logs"] });
      toast({
        title: "Email Sent",
        description: "Loss run request email has been sent successfully.",
      });
    },
  });
}

export function useMarkAsReviewed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from("loss_run_requests")
        .update({
          reviewed_at: new Date().toISOString(),
          reviewed_by: "Manual Review", // Placeholder until auth is implemented
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_request"] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests_by_client"] });
      toast({
        title: "Request Reviewed",
        description: "This loss run request has been marked as reviewed and locked.",
      });
    },
  });
}
