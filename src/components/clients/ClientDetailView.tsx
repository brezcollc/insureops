import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  ClipboardList, 
  Upload,
  CheckCircle,
  Loader2,
  Edit,
  Send
} from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { ClientOverviewTab } from "@/components/clients/tabs/ClientOverviewTab";
import { ClientPoliciesTab } from "@/components/clients/tabs/ClientPoliciesTab";
import { ClientLossRunsTab } from "@/components/clients/tabs/ClientLossRunsTab";
import { ClientDocumentsTab } from "@/components/clients/tabs/ClientDocumentsTab";
import { ClientReviewTab } from "@/components/clients/tabs/ClientReviewTab";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { BatchLossRunDialog } from "@/components/clients/BatchLossRunDialog";

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

export function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const { data: client, isLoading } = useClient(clientId);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchLossRunOpen, setIsBatchLossRunOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">{client.name}</h2>
                {client.status === "archived" ? (
                  <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-success/10 text-success border-0">Active</Badge>
                )}
              </div>
              {client.industry && (
                <p className="text-muted-foreground">{client.industry}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsBatchLossRunOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Request Loss Runs
          </Button>
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Policies</span>
          </TabsTrigger>
          <TabsTrigger value="loss-runs" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Loss Runs</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Review</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientOverviewTab client={client} />
        </TabsContent>

        <TabsContent value="policies">
          <ClientPoliciesTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="loss-runs">
          <ClientLossRunsTab clientId={clientId} clientName={client.name} />
        </TabsContent>

        <TabsContent value="documents">
          <ClientDocumentsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="review">
          <ClientReviewTab clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ClientFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        client={client}
      />

      {/* Batch Loss Run Dialog */}
      <BatchLossRunDialog
        open={isBatchLossRunOpen}
        onOpenChange={setIsBatchLossRunOpen}
        clientId={clientId}
        clientName={client.name}
        onSuccess={() => setActiveTab("loss-runs")}
      />
    </div>
  );
}
