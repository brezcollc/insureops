import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, AlertCircle, Send } from "lucide-react";
import { usePoliciesByClient, Policy } from "@/hooks/usePolicies";
import { useBatchLossRunRequests } from "@/hooks/useBatchLossRunRequests";
import { useLossRunsByClient } from "@/hooks/useClientLossRuns";
import type { CoverageType } from "@/hooks/useLossRunRequests";

interface BatchLossRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

const coverageTypeLabels: Record<CoverageType, string> = {
  general_liability: "General Liability",
  workers_compensation: "Workers' Comp",
  commercial_auto: "Commercial Auto",
  commercial_property: "Commercial Property",
  professional_liability: "Professional Liability",
  umbrella: "Umbrella",
  other: "Other",
};

export function BatchLossRunDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: BatchLossRunDialogProps) {
  const { data: policies, isLoading: policiesLoading } = usePoliciesByClient(clientId);
  const { data: existingRequests } = useLossRunsByClient(clientId);
  const batchCreate = useBatchLossRunRequests();

  const [selectedPolicyIds, setSelectedPolicyIds] = useState<Set<string>>(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Find policies with existing open requests
  const policiesWithOpenRequests = useMemo(() => {
    if (!existingRequests) return new Set<string>();
    return new Set(
      existingRequests
        .filter((r) => r.status === "requested" || r.status === "follow_up_sent")
        .map((r) => r.policy_number)
    );
  }, [existingRequests]);

  // Initialize selection when dialog opens (select all available policies)
  useMemo(() => {
    if (open && policies) {
      const availablePolicies = policies.filter(
        (p) => !policiesWithOpenRequests.has(p.policy_number)
      );
      setSelectedPolicyIds(new Set(availablePolicies.map((p) => p.id)));
      setShowConfirmation(false);
    }
  }, [open, policies, policiesWithOpenRequests]);

  const togglePolicy = (policyId: string) => {
    setSelectedPolicyIds((prev) => {
      const next = new Set(prev);
      if (next.has(policyId)) {
        next.delete(policyId);
      } else {
        next.add(policyId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!policies) return;
    const availablePolicies = policies.filter(
      (p) => !policiesWithOpenRequests.has(p.policy_number)
    );
    if (selectedPolicyIds.size === availablePolicies.length) {
      setSelectedPolicyIds(new Set());
    } else {
      setSelectedPolicyIds(new Set(availablePolicies.map((p) => p.id)));
    }
  };

  const selectedPolicies = useMemo(() => {
    if (!policies) return [];
    return policies.filter((p) => selectedPolicyIds.has(p.id));
  }, [policies, selectedPolicyIds]);

  const handleSubmit = async () => {
    if (selectedPolicies.length === 0) return;

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    await batchCreate.mutateAsync({
      clientId,
      policies: selectedPolicies,
    });

    onOpenChange(false);
    onSuccess?.();
  };

  const handleClose = () => {
    if (!batchCreate.isPending) {
      setShowConfirmation(false);
      onOpenChange(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const availablePolicies = policies?.filter(
    (p) => !policiesWithOpenRequests.has(p.policy_number)
  );

  const unavailablePolicies = policies?.filter((p) =>
    policiesWithOpenRequests.has(p.policy_number)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Request Loss Runs
          </DialogTitle>
          <DialogDescription>
            Select policies for {clientName} to request loss runs. One email will be sent per policy.
          </DialogDescription>
        </DialogHeader>

        {policiesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !policies || policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No policies found</p>
            <p className="text-sm text-muted-foreground">
              Add policies to this client before requesting loss runs.
            </p>
          </div>
        ) : showConfirmation ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">Confirm Submission</h4>
              <p className="text-muted-foreground">
                You are about to request loss runs for{" "}
                <span className="font-semibold text-foreground">
                  {selectedPolicies.length} {selectedPolicies.length === 1 ? "policy" : "policies"}
                </span>
                .
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                One email will be sent to each carrier. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                >
                  <span className="font-medium">
                    {coverageTypeLabels[policy.coverage_type]} — {policy.carriers?.name}
                  </span>
                  <span className="font-mono text-muted-foreground">{policy.policy_number}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Select All Header */}
            {availablePolicies && availablePolicies.length > 0 && (
              <div className="flex items-center gap-3 pb-3 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedPolicyIds.size === availablePolicies.length}
                  onCheckedChange={toggleAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Select all ({availablePolicies.length}{" "}
                  {availablePolicies.length === 1 ? "policy" : "policies"})
                </label>
              </div>
            )}

            {/* Policy List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {availablePolicies?.map((policy) => (
                <PolicyRow
                  key={policy.id}
                  policy={policy}
                  selected={selectedPolicyIds.has(policy.id)}
                  onToggle={() => togglePolicy(policy.id)}
                  formatDate={formatDate}
                />
              ))}

              {/* Unavailable policies section */}
              {unavailablePolicies && unavailablePolicies.length > 0 && (
                <div className="pt-4 mt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Already have open requests ({unavailablePolicies.length})</span>
                  </div>
                  {unavailablePolicies.map((policy) => (
                    <PolicyRow
                      key={policy.id}
                      policy={policy}
                      selected={false}
                      disabled
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {showConfirmation && (
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={batchCreate.isPending}
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={batchCreate.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedPolicies.length === 0 || batchCreate.isPending}
          >
            {batchCreate.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Requests...
              </>
            ) : showConfirmation ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send {selectedPolicies.length} Request{selectedPolicies.length > 1 ? "s" : ""}
              </>
            ) : (
              `Continue with ${selectedPolicies.length} Selected`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PolicyRowProps {
  policy: Policy;
  selected: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  formatDate: (date: string | null) => string;
}

function PolicyRow({ policy, selected, disabled, onToggle, formatDate }: PolicyRowProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        disabled
          ? "bg-muted/30 opacity-60 cursor-not-allowed"
          : selected
          ? "bg-primary/5 border-primary/30"
          : "hover:bg-muted/50 cursor-pointer"
      }`}
      onClick={disabled ? undefined : onToggle}
    >
      <Checkbox
        checked={selected}
        disabled={disabled}
        onCheckedChange={disabled ? undefined : onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="shrink-0">
            {coverageTypeLabels[policy.coverage_type]}
          </Badge>
          <span className="font-medium truncate">{policy.carriers?.name || "Unknown Carrier"}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{policy.policy_number}</span>
          <span>•</span>
          <span>
            {formatDate(policy.effective_date)} – {formatDate(policy.expiration_date)}
          </span>
        </div>
      </div>
      {disabled && (
        <Badge variant="outline" className="shrink-0 text-xs">
          Open Request
        </Badge>
      )}
    </div>
  );
}
