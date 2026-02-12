import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText
} from "lucide-react";
import type { Client } from "@/hooks/useClients";

interface ClientOverviewTabProps {
  client: Client;
}

export function ClientOverviewTab({ client }: ClientOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.contact_email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">
                {client.contact_email}
              </a>
            </div>
          )}
          {client.contact_phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{client.contact_phone}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <span>{client.address}</span>
            </div>
          )}
          {!client.contact_email && !client.contact_phone && !client.address && (
            <p className="text-muted-foreground text-sm">No contact information added</p>
          )}
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Industry</span>
            <span className="font-medium">{client.industry || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            {client.status === "archived" ? (
              <Badge variant="outline">Archived</Badge>
            ) : (
              <Badge variant="secondary" className="bg-success/10 text-success border-0">Active</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Renewal Date</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {client.renewal_date
                  ? new Date(client.renewal_date).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Added</span>
            <span className="font-medium">
              {new Date(client.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
