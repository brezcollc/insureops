import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  request_id: string;
  // Joined from loss_run_requests
  policy_number: string;
  coverage_type: string;
  request_status: string;
  carrier_name: string | null;
}

export function useClientDocuments(clientId: string | null) {
  return useQuery({
    queryKey: ["client_documents", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      // Fetch documents through loss_run_requests to get client association
      const { data, error } = await supabase
        .from("loss_run_documents")
        .select(`
          *,
          loss_run_requests!inner (
            client_id,
            policy_number,
            coverage_type,
            status,
            carriers (name)
          )
        `)
        .eq("loss_run_requests.client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the structure
      return (data || []).map((doc: any) => ({
        id: doc.id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        uploaded_by: doc.uploaded_by,
        created_at: doc.created_at,
        request_id: doc.request_id,
        policy_number: doc.loss_run_requests?.policy_number || "Unknown",
        coverage_type: doc.loss_run_requests?.coverage_type || "other",
        request_status: doc.loss_run_requests?.status || "requested",
        carrier_name: doc.loss_run_requests?.carriers?.name || null,
      })) as ClientDocument[];
    },
    enabled: !!clientId,
  });
}

export function useDocumentUrl(filePath: string | null) {
  return useQuery({
    queryKey: ["document_url", filePath],
    queryFn: async () => {
      if (!filePath) return null;

      const { data, error } = await supabase.storage
        .from("loss-run-documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
