import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, FileText } from "lucide-react";

interface ClientReviewTabProps {
  clientId: string;
}

export function ClientReviewTab({ clientId }: ClientReviewTabProps) {
  // This will show parsed claim data and agent summaries in the future
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Data Review</h3>
        <p className="text-sm text-muted-foreground">
          Review parsed claim data and agent-generated summaries
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">No Data Ready for Review</h4>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Upload loss run documents and complete parsing to see structured data here for review.
          </p>
          <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-4 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>All extracted data requires review by a licensed insurance professional</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
