import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Upload,
  FileText,
  Calendar,
  Trash2,
  Loader2,
  AlertCircle,
  StickyNote,
} from "lucide-react";
import {
  usePolicyDocuments,
  useUploadPolicyDocument,
  useDeletePolicyDocument,
  type PolicyDocument,
} from "@/hooks/usePolicyDocuments";
import { useDocumentUrl } from "@/hooks/useClientDocuments";

interface PolicyLossRunDocumentsProps {
  policyId: string;
  clientId: string;
  policyNumber: string;
}

function DocumentCard({ doc, policyId }: { doc: PolicyDocument; policyId: string }) {
  const { data: signedUrl, isLoading: urlLoading } = useDocumentUrl(doc.file_path);
  const deleteDoc = useDeletePolicyDocument();
  const [showDelete, setShowDelete] = useState(false);

  const handleOpen = () => {
    if (signedUrl) window.open(signedUrl, "_blank");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Card
        className="p-0 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow group"
        onClick={handleOpen}
      >
        <div className="flex items-stretch">
          <div className="w-1 bg-primary/60 shrink-0" />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-destructive/5 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-destructive/70" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-foreground text-sm leading-tight">
                    {doc.title || doc.file_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(doc.created_at)}
                    </span>
                    {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                    <span className="font-mono text-[11px]">{doc.file_name}</span>
                  </div>
                  {doc.notes && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
                      <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{doc.notes}</span>
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDelete(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{doc.title || doc.file_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDoc.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDoc.mutate({ document: doc, policyId })}
              disabled={deleteDoc.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDoc.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PolicyLossRunDocuments({ policyId, clientId, policyNumber }: PolicyLossRunDocumentsProps) {
  const { data: documents, isLoading } = usePolicyDocuments(policyId);
  const uploadDoc = useUploadPolicyDocument();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setSelectedFile(null);
    setFileError("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are accepted. Please select a .pdf document.");
      setSelectedFile(null);
      return;
    }

    setFileError("");
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    await uploadDoc.mutateAsync({
      policyId,
      clientId,
      file: selectedFile,
      title: title.trim(),
      notes: notes.trim() || undefined,
    });

    resetForm();
    setIsUploadOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Loss Run Documents</h4>
          <p className="text-xs text-muted-foreground">
            {(documents?.length || 0) > 0
              ? `${documents!.length} ${documents!.length === 1 ? "document" : "documents"} on file`
              : "No documents uploaded yet"}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Loss Run
        </Button>
      </div>

      {(documents || []).length > 0 ? (
        <div className="grid gap-2">
          {(documents || []).map((doc) => (
            <DocumentCard key={doc.id} doc={doc as PolicyDocument} policyId={policyId} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No loss run documents for this policy yet.
            </p>
          </div>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsUploadOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Loss Run</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Policy: <span className="font-mono font-medium text-foreground">{policyNumber}</span>
            </div>

            {/* File Selection */}
            <div className="space-y-2">
              <Label>File (PDF only)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2 shrink-0" />
                {selectedFile ? (
                  <span className="truncate">{selectedFile.name}</span>
                ) : (
                  <span className="text-muted-foreground">Choose a PDF file...</span>
                )}
              </Button>
              {fileError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fileError}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2024 Loss Run Report"
                maxLength={200}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context about this document..."
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsUploadOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploadDoc.isPending}
            >
              {uploadDoc.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
