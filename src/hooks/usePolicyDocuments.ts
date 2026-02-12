import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PolicyDocument {
  id: string;
  policy_id: string;
  client_id: string;
  title: string;
  notes: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function usePolicyDocuments(policyId: string | null) {
  return useQuery({
    queryKey: ["policy_documents", policyId],
    queryFn: async () => {
      if (!policyId) return [];

      const { data, error } = await supabase
        .from("loss_run_documents")
        .select("*")
        .eq("policy_id", policyId)
        .is("request_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PolicyDocument[];
    },
    enabled: !!policyId,
  });
}

interface UploadPolicyDocumentParams {
  policyId: string;
  clientId: string;
  file: File;
  title: string;
  notes?: string;
}

export function useUploadPolicyDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ policyId, clientId, file, title, notes }: UploadPolicyDocumentParams) => {
      // Validate PDF only
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are accepted. Please upload a .pdf document.");
      }

      const filePath = `policies/${policyId}/${Date.now()}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("loss-run-documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: docRecord, error: dbError } = await supabase
        .from("loss_run_documents")
        .insert([{
          policy_id: policyId,
          client_id: clientId,
          title,
          notes: notes || null,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: "Manual Upload",
        }])
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to record document: ${dbError.message}`);
      }

      return { document: docRecord, policyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["policy_documents", result.policyId] });
      queryClient.invalidateQueries({ queryKey: ["client_documents"] });
      toast({
        title: "Loss Run Uploaded",
        description: `${result.document.title || result.document.file_name} uploaded successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeletePolicyDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ document, policyId }: { document: PolicyDocument; policyId: string }) => {
      await supabase.storage
        .from("loss-run-documents")
        .remove([document.file_path]);

      const { error } = await supabase
        .from("loss_run_documents")
        .delete()
        .eq("id", document.id);

      if (error) throw new Error(`Failed to delete: ${error.message}`);
      return { policyId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["policy_documents", result.policyId] });
      queryClient.invalidateQueries({ queryKey: ["client_documents"] });
      toast({ title: "Document Deleted", description: "Loss run document removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });
}
