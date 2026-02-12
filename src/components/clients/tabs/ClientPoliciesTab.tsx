import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Plus, FileText, Loader2, Trash2, Edit, Mail, Calendar, Shield } from "lucide-react";
import { usePoliciesByClient, useDeletePolicy } from "@/hooks/usePolicies";
import { PolicyFormDialog } from "@/components/clients/PolicyFormDialog";
import { useLossRunsByClient } from "@/hooks/useClientLossRuns";
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
    <div className="space-y-5">
      {/* Header with prominent Add Policy button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Policies</h3>
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
        <div className="grid gap-3">
          {(policies || []).map((policy) => {
            const lastRequested = lastRequestedMap.get(policy.policy_number);
            const period = formatPolicyPeriod(policy.effective_date, policy.expiration_date);

            return (
              <Card
                key={policy.id}
                className="p-0 overflow-hidden cursor-pointer hover:shadow-card-hover transition-shadow group"
                onClick={() => setEditingPolicy(policy)}
              >
                <div className="flex items-stretch">
                  {/* Left accent bar */}
                  <div className="w-1 bg-primary shrink-0" />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Policy info */}
                      <div className="min-w-0 flex-1 space-y-2">
                        {/* Top line: policy number + coverage type */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-foreground">
                            {policy.policy_number}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {coverageTypeLabels[policy.coverage_type] || policy.coverage_type}
                          </Badge>
                        </div>

                        {/* Detail rows */}
                        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                          {/* Carrier */}
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            {policy.carriers?.name || "Unknown Carrier"}
                          </span>

                          {/* Policy Period */}
                          {period && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {period}
                            </span>
                          )}
                        </div>

                        {/* Carrier email */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {policy.carrier_email ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted border border-border/60 text-muted-foreground max-w-[280px] truncate">
                              <Mail className="w-3 h-3 shrink-0 text-primary" />
                              {policy.carrier_email}
                            </span>
                          ) : (
                            <span className="text-xs text-destructive/70 italic flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              No carrier email set
                            </span>
                          )}

                          {lastRequested && (
                            <span className="text-xs text-muted-foreground">
                              Last requested: {formatShortDate(lastRequested)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPolicy(policy);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingPolicy(policy);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No policies yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add policies to track loss run requests for this client.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </div>
        </Card>
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
