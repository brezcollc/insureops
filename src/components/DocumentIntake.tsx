import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "uploading" | "completed" | "error";
  uploadedAt: string;
  error?: string;
}

export function DocumentIntake() {
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    const docId = crypto.randomUUID();
    const newDoc: UploadedDocument = {
      id: docId,
      name: file.name,
      type: "Loss Run Document",
      size: `${(file.size / 1024).toFixed(1)} KB`,
      status: "uploading",
      uploadedAt: "Just now",
    };

    setDocuments(prev => [newDoc, ...prev]);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mark as completed - documents are stored for human review only
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId
          ? { ...doc, status: "completed" }
          : doc
      )
    );

    toast({
      title: "Document Uploaded",
      description: `${file.name} is ready for review`,
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => processFile(file));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => processFile(file));
    e.target.value = ""; // Reset input
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Zone */}
      <div
        className={cn(
          "card-elevated p-8 border-2 border-dashed transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,.txt,.csv,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload Loss Run Documents
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Drag and drop loss run documents here, or click to browse. Documents will be stored for human review.
          </p>
          <Button>
            Browse Files
          </Button>
        </div>
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="card-elevated overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Uploaded Documents</h3>
            <p className="text-sm text-muted-foreground">Documents ready for review</p>
          </div>

          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type} • {doc.size}
                    {doc.error && ` • Error: ${doc.error}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                  {doc.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {doc.status === "uploading" && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {doc.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> All documents are stored for review by licensed insurance professionals. 
          Automated processing is not performed on document contents.
        </p>
      </div>
    </div>
  );
}
