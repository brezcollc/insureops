import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, 
  FileText, 
  ClipboardList, 
  Upload,
  Loader2,
  Edit,
  Send,
  CheckCircle2,
  AlertCircle,
  StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClient } from "@/hooks/useClients";
import { usePoliciesByClient } from "@/hooks/usePolicies";
import { useLossRunsByClient } from "@/hooks/useClientLossRuns";
import { ClientOverviewTab } from "@/components/clients/tabs/ClientOverviewTab";
import { ClientPoliciesTab } from "@/components/clients/tabs/ClientPoliciesTab";
import { ClientLossRunsTab } from "@/components/clients/tabs/ClientLossRunsTab";
import { ClientDocumentsTab } from "@/components/clients/tabs/ClientDocumentsTab";
import { ClientNotesTab } from "@/components/clients/tabs/ClientNotesTab";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { BatchLossRunDialog } from "@/components/clients/BatchLossRunDialog";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

const tabs = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "policies", label: "Policies", icon: FileText },
  { id: "loss-runs", label: "Loss Run Requests", icon: ClipboardList },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "notes", label: "Notes", icon: StickyNote },
];

const tabLabels: Record<string, string> = {
  overview: "Overview",
  policies: "Policies",
  "loss-runs": "Loss Run Requests",
  documents: "Documents",
  notes: "Notes",
};

export function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const { data: client, isLoading } = useClient(clientId);
  const { data: policies } = usePoliciesByClient(clientId);
  const { data: lossRuns } = useLossRunsByClient(clientId);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchLossRunOpen, setIsBatchLossRunOpen] = useState(false);

  // Calculate stats
  const policyCount = policies?.length || 0;
  const totalRequests = lossRuns?.length || 0;
  const reviewedRequests = lossRuns?.filter(r => r.reviewed_at)?.length || 0;
  const pendingRequests = totalRequests - reviewedRequests;
  const isComplete = totalRequests > 0 && reviewedRequests === totalRequests;

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
          Back to Clients
        </Button>
      </div>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Clients", onClick: onBack },
    { label: client.name },
    ...(activeTab !== "overview" ? [{ label: tabLabels[activeTab] }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <ClientOverviewTab client={client} />;
      case "policies":
        return <ClientPoliciesTab clientId={clientId} />;
      case "loss-runs":
        return <ClientLossRunsTab clientId={clientId} clientName={client.name} />;
      case "documents":
        return <ClientDocumentsTab clientId={clientId} />;
      case "notes":
        return <ClientNotesTab client={client} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Client Header Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-foreground truncate">{client.name}</h2>
                {client.client_code && (
                  <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    {client.client_code}
                  </span>
                )}
                {client.status === "archived" ? (
                  <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-success/10 text-success border-0">Active</Badge>
                )}
              </div>
              {client.industry && (
                <p className="text-sm text-muted-foreground mt-1">{client.industry}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setIsBatchLossRunOpen(true)} size="default">
              <Send className="w-4 h-4 mr-2" />
              Request Loss Runs
            </Button>
            <Button variant="outline" onClick={() => setIsEditOpen(true)} size="default">
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-6 flex-wrap text-sm mt-5 pt-5 border-t border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-semibold tabular-nums text-foreground">{policyCount}</span>
              <span className="text-muted-foreground ml-1">{policyCount === 1 ? "Policy" : "Policies"}</span>
            </div>
          </div>

          <div className="w-px h-8 bg-border" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-semibold tabular-nums text-foreground">{totalRequests}</span>
              <span className="text-muted-foreground ml-1">{totalRequests === 1 ? "Request" : "Requests"}</span>
            </div>
          </div>

          <div className="w-px h-8 bg-border" />

          {totalRequests > 0 ? (
            <div className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-success font-semibold">All Reviewed</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span className="text-warning font-semibold">{pendingRequests} Pending Review</span>
                </>
              )}
              <span className="text-muted-foreground text-xs tabular-nums">({reviewedRequests}/{totalRequests})</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No loss run requests yet</span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-b border-border">
        <div className="flex items-center gap-1 -mb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "policies" && policyCount > 0 && (
                  <Badge variant="secondary" className={cn(
                    "ml-1 h-5 px-1.5 text-[11px]",
                    isActive ? "bg-primary/10 text-primary" : ""
                  )}>
                    {policyCount}
                  </Badge>
                )}
                {tab.id === "loss-runs" && pendingRequests > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px] bg-warning/10 text-warning">
                    {pendingRequests}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

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
