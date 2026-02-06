import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import { DocumentIntake } from "@/components/DocumentIntake";

interface ClientDocumentsTabProps {
  clientId: string;
}

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  // For now, we render the document intake component
  // In the future, this could be scoped to show only documents for this client
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload and store loss run documents for review
        </p>
      </div>

      <DocumentIntake />
    </div>
  );
}
