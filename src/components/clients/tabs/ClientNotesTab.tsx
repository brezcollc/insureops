import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { Client } from "@/hooks/useClients";

interface ClientNotesTabProps {
  client: Client;
}

export function ClientNotesTab({ client }: ClientNotesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Internal Notes</h3>
        <p className="text-sm text-muted-foreground">
          Private notes about this client — visible only to your team
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {client.internal_notes ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{client.internal_notes}</p>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No notes yet</p>
              <p className="text-sm text-muted-foreground">
                Click "Edit" in the header to add internal notes for this client.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
