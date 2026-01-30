import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "processing" | "completed" | "error";
  uploadedAt: string;
}

const mockDocuments: UploadedDocument[] = [
  {
    id: "1",
    name: "AcmeCorp_LossRun_2023.pdf",
    type: "Loss Run Report",
    size: "2.4 MB",
    status: "completed",
    uploadedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "TechStart_PolicyDec.pdf",
    type: "Policy Declaration",
    size: "1.1 MB",
    status: "processing",
    uploadedAt: "15 minutes ago",
  },
  {
    id: "3",
    name: "BuildRight_Claims_History.xlsx",
    type: "Claims Data",
    size: "856 KB",
    status: "completed",
    uploadedAt: "1 day ago",
  },
];

export function DocumentIntake() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Zone */}
      <div
        className={cn(
          "card-elevated p-8 border-2 border-dashed transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Upload Documents
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Drag and drop files here, or click to browse. Supports PDF, Excel, and image files.
          </p>
          <Button>
            Browse Files
          </Button>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Documents</h3>
          <p className="text-sm text-muted-foreground">Documents uploaded in the last 7 days</p>
        </div>
        
        <div className="divide-y divide-border">
          {mockDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.type} • {doc.size}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
                {doc.status === "completed" && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
                {doc.status === "processing" && (
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
                {doc.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
