import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, Trash2, Download, Loader2, Lock, Eye, Sparkles } from "lucide-react";
import { useRequestDocuments, useUploadDocument, useDeleteDocument, LossRunDocument } from "@/hooks/useDocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyzeDocument, useDocumentAnalysis } from "@/hooks/useLossRunAnalysis";
import { LossRunAnalysisPanel } from "@/components/LossRunAnalysisPanel";

interface DocumentUploadSectionProps {
  requestId: string;
  isReviewed: boolean;
}

// Per-document row with its own analysis state
function DocumentRow({
  doc,
  requestId,
  isReviewed,
  onView,
  onDownload,
  onDelete,
  viewingDoc,
}: {
  doc: LossRunDocument;
  requestId: string;
  isReviewed: boolean;
  onView: (doc: LossRunDocument) => void;
  onDownload: (doc: LossRunDocument) => void;
  onDelete: (doc: LossRunDocument) => void;
  viewingDoc: string | null;
}) {
  const isPdf = doc.mime_type === "application/pdf" || doc.file_name.toLowerCase().endsWith(".pdf");
  const analyzeDocument = useAnalyzeDocument();
  const { data: analysis } = useDocumentAnalysis(isPdf ? doc.id : null);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isAnalyzing = analyzeDocument.isPending || analysis?.status === "processing" || analysis?.status === "pending";
  const hasAnalysis = analysis?.status === "completed" || analysis?.status === "failed";

  return (
    <div>
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{doc.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}
              {analysis?.status === "completed" && (
                <span className="ml-2 text-blue-600 font-medium">· AI analyzed</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => analyzeDocument.mutate({ documentId: doc.id, requestId })}
              disabled={isAnalyzing}
              className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title={hasAnalysis ? "Re-analyze with AI" : "Analyze with AI"}
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="ml-1">{hasAnalysis ? "Re-analyze" : "Analyze"}</span>
            </Button>
          )}
          {isPdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(doc)}
              disabled={viewingDoc === doc.id}
              className="h-8 w-8 p-0"
              title="View document"
            >
              {viewingDoc === doc.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(doc)}
            className="h-8 w-8 p-0"
            title="Download document"
          >
            <Download className="w-4 h-4" />
          </Button>
          {!isReviewed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      {/* Analysis panel shown below the document row */}
      {analysis && <LossRunAnalysisPanel analysis={analysis} />}
    </div>
  );
}

export function DocumentUploadSection({ requestId, isReviewed }: DocumentUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents, isLoading } = useRequestDocuments(requestId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [documentToDelete, setDocumentToDelete] = useState<LossRunDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    await uploadDocument.mutateAsync({
      requestId,
      file,
      isReviewed,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleView = async (doc: LossRunDocument) => {
    setViewingDoc(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from("loss-run-documents")
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      if (error) {
        return;
      }

      window.open(data.signedUrl, "_blank");
    } finally {
      setViewingDoc(null);
    }
  };

  const handleDownload = async (doc: LossRunDocument) => {
    const { data, error } = await supabase.storage
      .from("loss-run-documents")
      .download(doc.file_path);

    if (error) {
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    await deleteDocument.mutateAsync({
      document: documentToDelete,
      requestId,
    });
    
    setDocumentToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents
          {documents && documents.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {documents.length}
            </Badge>
          )}
        </h4>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadDocument.isPending || isReviewed}
          title={isReviewed ? "Cannot upload to reviewed request" : undefined}
        >
          {uploadDocument.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isReviewed ? (
            <Lock className="w-4 h-4 mr-2" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              requestId={requestId}
              isReviewed={isReviewed}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={setDocumentToDelete}
              viewingDoc={viewingDoc}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No documents uploaded yet</p>
          {!isReviewed && (
            <p className="text-xs mt-1">Upload a loss run document for review</p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
