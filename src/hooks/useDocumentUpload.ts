 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { useAgentAction } from "@/hooks/useAgentAction";
 
 export interface LossRunDocument {
   id: string;
   request_id: string;
   file_name: string;
   file_path: string;
   file_size: number | null;
   mime_type: string | null;
   uploaded_by: string | null;
   created_at: string;
 }
 
 export function useRequestDocuments(requestId: string | null) {
   return useQuery({
     queryKey: ["loss_run_documents", requestId],
     queryFn: async () => {
       if (!requestId) return [];
       
       const { data, error } = await supabase
         .from("loss_run_documents")
         .select("*")
         .eq("request_id", requestId)
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       return data as LossRunDocument[];
     },
     enabled: !!requestId,
   });
 }
 
 interface UploadDocumentParams {
   requestId: string;
   file: File;
   autoTriggerAgent?: boolean;
   isReviewed?: boolean;
 }
 
 export function useUploadDocument() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
   const agentAction = useAgentAction({ silent: false });
 
   return useMutation({
     mutationFn: async ({ requestId, file, autoTriggerAgent = true, isReviewed = false }: UploadDocumentParams) => {
       // Generate unique file path
       const fileExt = file.name.split(".").pop();
       const fileName = `${requestId}/${Date.now()}-${file.name}`;
       
       // Upload to storage
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from("loss-run-documents")
         .upload(fileName, file, {
           cacheControl: "3600",
           upsert: false,
         });
       
       if (uploadError) {
         throw new Error(`Upload failed: ${uploadError.message}`);
       }
       
       // Record in database
       const { data: docRecord, error: dbError } = await supabase
         .from("loss_run_documents")
         .insert([{
           request_id: requestId,
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
       
       return { document: docRecord, autoTriggerAgent, isReviewed, requestId };
     },
     onSuccess: async (result) => {
       queryClient.invalidateQueries({ queryKey: ["loss_run_documents", result.requestId] });
       queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
       
       toast({
         title: "Document Uploaded",
         description: `${result.document.file_name} uploaded successfully`,
       });
       
       // Auto-trigger agent if enabled and request is not reviewed
       if (result.autoTriggerAgent && !result.isReviewed) {
         try {
           await agentAction.mutateAsync({
             requestId: result.requestId,
             triggerType: "document_upload",
           });
         } catch (error) {
           console.error("Agent auto-trigger failed:", error);
           // Don't show error - the upload was successful
         }
       }
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
 
 export function useDeleteDocument() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ document, requestId }: { document: LossRunDocument; requestId: string }) => {
       // Delete from storage
       const { error: storageError } = await supabase.storage
         .from("loss-run-documents")
         .remove([document.file_path]);
       
       if (storageError) {
         console.error("Storage delete error:", storageError);
       }
       
       // Delete from database
       const { error: dbError } = await supabase
         .from("loss_run_documents")
         .delete()
         .eq("id", document.id);
       
       if (dbError) {
         throw new Error(`Failed to delete document: ${dbError.message}`);
       }
       
       return { requestId };
     },
     onSuccess: (result) => {
       queryClient.invalidateQueries({ queryKey: ["loss_run_documents", result.requestId] });
       toast({
         title: "Document Deleted",
         description: "Document removed successfully",
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Delete Failed",
         description: error.message,
         variant: "destructive",
       });
     },
   });
 }
 
 export function useDocumentDownloadUrl(filePath: string | null) {
   if (!filePath) return null;
   
   const { data } = supabase.storage
     .from("loss-run-documents")
     .getPublicUrl(filePath);
   
   return data.publicUrl;
 }