import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Loader2, 
  Eye,
  Calendar,
  Building2,
  FileCheck
} from "lucide-react";
import { useClientDocuments, useDocumentUrl, ClientDocument } from "@/hooks/useClientDocuments";
import { supabase } from "@/integrations/supabase/client";

interface ClientDocumentsTabProps {
  clientId: string;
}

const coverageTypeLabels: Record<string, string> = {
  general_liability: "General Liability",
  workers_compensation: "Workers' Comp",
  commercial_auto: "Commercial Auto",
  commercial_property: "Commercial Property",
  professional_liability: "Professional Liability",
  umbrella: "Umbrella",
  other: "Other",
};

function DocumentRow({ doc }: { doc: ClientDocument }) {
  const [showPreview, setShowPreview] = useState(false);
  const { data: signedUrl, isLoading: urlLoading } = useDocumentUrl(doc.file_path);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    const { data, error } = await supabase.storage
      .from("loss-run-documents")
      .download(doc.file_path);

    if (error) {
      console.error("Download error:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleView = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  const isPdf = doc.mime_type === "application/pdf" || doc.file_name.toLowerCase().endsWith(".pdf");

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{doc.file_name}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(doc.created_at).toLocaleDateString()}
              </span>
              {doc.file_size && (
                <span>{formatFileSize(doc.file_size)}</span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {doc.carrier_name || "Unknown Carrier"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {coverageTypeLabels[doc.coverage_type] || doc.coverage_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {doc.policy_number}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              disabled={urlLoading}
              className="h-8"
            >
              {urlLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="ml-1">View</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="w-4 h-4" />
            <span className="ml-1">Download</span>
          </Button>
        </div>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{doc.file_name}</DialogTitle>
          </DialogHeader>
          {signedUrl && (
            <iframe
              src={signedUrl}
              className="w-full h-full rounded-lg"
              title={doc.file_name}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const { data: documents, isLoading, error } = useClientDocuments(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Documents</h3>
        <p className="text-sm text-muted-foreground">
          Loss run documents uploaded for this client's requests
        </p>
      </div>

      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="card-elevated border-dashed">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">No Documents Yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Documents will appear here when uploaded through Loss Run Requests. 
              Open a request and upload documents from there.
            </p>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Documents are uploaded per Loss Run Request. 
          To upload a new document, open the relevant request from the Loss Runs tab and use the upload feature there.
        </p>
      </div>
    </div>
  );
}
