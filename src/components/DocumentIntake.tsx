import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { parseLossRunDocument, LossRunData } from "@/lib/api/lossRunParser";
import { ParsedLossRunView } from "@/components/ParsedLossRunView";

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "processing" | "completed" | "error";
  uploadedAt: string;
  parsedData?: LossRunData;
  error?: string;
}

export function DocumentIntake() {
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const { toast } = useToast();

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For now, we'll handle text-based files
    // In production, you'd use a PDF parser library
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return await file.text();
    }
    
    // For PDF files, we'll read as text (basic extraction)
    // Note: Full PDF parsing would require a library like pdf-parse
    const text = await file.text();
    return text;
  };

  const processFile = async (file: File) => {
    const docId = crypto.randomUUID();
    const newDoc: UploadedDocument = {
      id: docId,
      name: file.name,
      type: "Loss Run Report",
      size: `${(file.size / 1024).toFixed(1)} KB`,
      status: "processing",
      uploadedAt: "Just now",
    };

    setDocuments(prev => [newDoc, ...prev]);

    try {
      // Extract text from the file
      const documentText = await extractTextFromFile(file);
      
      if (!documentText || documentText.length < 50) {
        throw new Error("Could not extract sufficient text from the document. Please ensure it's a valid loss run document.");
      }

      // Parse with AI
      const result = await parseLossRunDocument(documentText);

      if (result.success && result.data) {
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === docId
              ? { ...doc, status: "completed", parsedData: result.data }
              : doc
          )
        );
        toast({
          title: "Document Parsed Successfully",
          description: `Extracted ${result.data.claims.length} claims from ${file.name}`,
        });
      } else {
        throw new Error(result.error || "Failed to parse document");
      }
    } catch (error) {
      console.error("Processing error:", error);
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === docId
            ? { ...doc, status: "error", error: error instanceof Error ? error.message : "Unknown error" }
            : doc
        )
      );
      toast({
        title: "Parsing Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    }
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

  if (selectedDocument?.parsedData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{selectedDocument.name}</h3>
            <p className="text-sm text-muted-foreground">Parsed loss run data</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedDocument(null)}>
            ← Back to Documents
          </Button>
        </div>
        <ParsedLossRunView data={selectedDocument.parsedData} />
      </div>
    );
  }

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
          accept=".pdf,.txt,.csv"
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
            Drag and drop loss run PDFs here, or click to browse. The AI will extract claim data exactly as written.
          </p>
          <Button>
            Browse Files
          </Button>
        </div>
      </div>

      {/* Processed Documents */}
      {documents.length > 0 && (
        <div className="card-elevated overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Processed Documents</h3>
            <p className="text-sm text-muted-foreground">Click on a completed document to view extracted data</p>
          </div>

          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors",
                  doc.status === "completed" && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => doc.status === "completed" && setSelectedDocument(doc)}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type} • {doc.size}
                    {doc.parsedData && ` • ${doc.parsedData.claims.length} claims extracted`}
                    {doc.error && ` • Error: ${doc.error}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                  {doc.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {doc.status === "processing" && (
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
    </div>
  );
}
