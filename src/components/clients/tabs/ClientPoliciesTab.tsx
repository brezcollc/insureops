import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, FileText, Loader2, Trash2, Edit, Mail, Calendar, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { usePoliciesByClient, useDeletePolicy } from "@/hooks/usePolicies";
import { PolicyFormDialog } from "@/components/clients/PolicyFormDialog";
import { useLossRunsByClient } from "@/hooks/useClientLossRuns";
import { PolicyLossRunDocuments } from "@/components/clients/PolicyLossRunDocuments";
import type { Policy } from "@/hooks/usePolicies";

interface ClientPoliciesTabProps {
  clientId: string;
}

const coverageTypeLabels: Record<string, string> = {
  general_liability: "General Liability",
  workers_compensation: "Workers' Comp",
  commercial_auto: "Commercial Auto",
  commercial_property: "Commercial Property",
  professional_liability: "Professional Liability",
  umbrella: "Umbrella",
  other: "Other",
};

export function ClientPoliciesTab({ clientId }: ClientPoliciesTabProps) {
  const { data: policies, isLoading } = usePoliciesByClient(clientId);
  const { data: lossRunRequests } = useLossRunsByClient(clientId);
  const deletePolicy = useDeletePolicy();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<Policy | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingPolicy) return;
    await deletePolicy.mutateAsync({ id: deletingPolicy.id, clientId });
    setDeletingPolicy(null);
  };

  // Build a map of policy_number -> latest request date
  const lastRequestedMap = new Map<string, string>();
  (lossRunRequests || []).forEach((req) => {
    const existing = lastRequestedMap.get(req.policy_number);
    if (!existing || new Date(req.request_date) > new Date(existing)) {
      lastRequestedMap.set(req.policy_number, req.request_date);
    }
  });

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPolicyPeriod = (effective: string | null, expiration: string | null) => {
    if (!effective && !expiration) return null;
    const eff = effective ? formatShortDate(effective) : "—";
    const exp = expiration ? formatShortDate(expiration) : "—";
    return `${eff} → ${exp}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Policies</h3>
          <p className="text-sm text-muted-foreground">
            {(policies?.length || 0) > 0
              ? `${policies!.length} ${policies!.length === 1 ? "policy" : "policies"} on file`
              : "No policies yet — add one to get started"}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="default">
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </div>

      {/* Policy Cards */}
      {(policies || []).length > 0 ? (
        <div className="grid gap-4">
          {(policies || []).map((policy) => {
            const lastRequested = lastRequestedMap.get(policy.policy_number);
            const period = formatPolicyPeriod(policy.effective_date, policy.expiration_date);
            const isExpanded = expandedPolicy === policy.id;

            return (
              <div
                key={policy.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/20 transition-all duration-200"
              >
                {/* Policy Header */}
                <div className="p-5 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      {/* Title */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-foreground text-base">{policy.policy_number}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {coverageTypeLabels[policy.coverage_type] || policy.coverage_type}
                          </Badge>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium w-16 shrink-0">Carrier</span>
                          <span className="font-medium text-foreground truncate">{policy.carriers?.name || "Unknown Carrier"}</span>
                        </div>
                        {period && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium w-16 shrink-0">Period</span>
                            <span className="flex items-center gap-1.5 text-foreground">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {period}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium w-16 shrink-0">Email</span>
                          {policy.carrier_email ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted border border-border/60 text-muted-foreground max-w-[240px] truncate">
                              <Mail className="w-3 h-3 shrink-0 text-primary" />
                              {policy.carrier_email}
                            </span>
                          ) : (
                            <span className="text-xs text-destructive/70 italic flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Not set
                            </span>
                          )}
                        </div>
                        {lastRequested && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium w-16 shrink-0">Last Req</span>
                            <span className="text-xs text-muted-foreground">{formatShortDate(lastRequested)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); setEditingPolicy(policy); }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setDeletingPolicy(policy); }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Documents Toggle */}
                <div className="border-t border-border/60">
                  <button
                    className="flex items-center gap-2 w-full px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <FileText className="w-3.5 h-3.5" />
                    Loss Run Documents
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <PolicyLossRunDocuments policyId={policy.id} clientId={clientId} policyNumber={policy.policy_number} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-dashed border-border">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No policies yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add policies to track loss run requests for this client.</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </div>
        </div>
      )}

      <PolicyFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        clientId={clientId}
      />

      {editingPolicy && (
        <PolicyFormDialog
          open={!!editingPolicy}
          onOpenChange={(open) => !open && setEditingPolicy(null)}
          clientId={clientId}
          policy={editingPolicy}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPolicy} onOpenChange={(open) => !open && setDeletingPolicy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete policy <strong>{deletingPolicy?.policy_number}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePolicy.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deletePolicy.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePolicy.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
