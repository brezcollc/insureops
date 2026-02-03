import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText } from "lucide-react";
import {
  useClients,
  useCreateLossRunRequest,
  useCreateClient,
  CoverageType,
} from "@/hooks/useLossRunRequests";
import { usePoliciesByClient, Policy } from "@/hooks/usePolicies";

interface NewRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedClientId?: string;
}

const coverageTypeLabels: Record<CoverageType, string> = {
  general_liability: "General Liability",
  workers_compensation: "Workers' Compensation",
  commercial_auto: "Commercial Auto",
  commercial_property: "Commercial Property",
  professional_liability: "Professional Liability",
  umbrella: "Umbrella",
  other: "Other",
};

export function NewRequestForm({ open, onOpenChange, onSuccess, preselectedClientId }: NewRequestFormProps) {
  const { toast } = useToast();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const createRequest = useCreateLossRunRequest();
  const createClient = useCreateClient();

  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [policyEffectiveDate, setPolicyEffectiveDate] = useState("");
  const [policyExpirationDate, setPolicyExpirationDate] = useState("");
  const [notes, setNotes] = useState("");

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Fetch policies for selected client
  const { data: policies, isLoading: policiesLoading } = usePoliciesByClient(clientId || null);

  // Get the selected policy details
  const selectedPolicy = useMemo(() => {
    if (!selectedPolicyId || !policies) return null;
    return policies.find((p) => p.id === selectedPolicyId) || null;
  }, [selectedPolicyId, policies]);

  // Check if we're in client-scoped mode (client pre-selected)
  const isClientScoped = !!preselectedClientId;

  // Update client_id when preselectedClientId changes
  React.useEffect(() => {
    if (preselectedClientId && open) {
      setClientId(preselectedClientId);
    }
  }, [preselectedClientId, open]);

  // Reset policy selection when client changes
  React.useEffect(() => {
    setSelectedPolicyId("");
    setPolicyEffectiveDate("");
    setPolicyExpirationDate("");
  }, [clientId]);

  // Auto-fill dates when policy is selected
  React.useEffect(() => {
    if (selectedPolicy) {
      setPolicyEffectiveDate(selectedPolicy.effective_date || "");
      setPolicyExpirationDate(selectedPolicy.expiration_date || "");
    }
  }, [selectedPolicy]);

  const resetForm = () => {
    if (!isClientScoped) {
      setClientId("");
    }
    setSelectedPolicyId("");
    setPolicyEffectiveDate("");
    setPolicyExpirationDate("");
    setNotes("");
    setShowNewClient(false);
    setNewClientName("");
    setNewClientEmail("");
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const client = await createClient.mutateAsync({
        name: newClientName.trim(),
        contact_email: newClientEmail.trim() || undefined,
      });
      
      setClientId(client.id);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
      
      toast({
        title: "Client Created",
        description: `${client.name} has been added`,
      });
    } catch (error) {
      console.error("Create client error:", error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    console.log("[NewRequestForm] Submit clicked", { clientId, selectedPolicyId });

    // Validation
    if (!clientId) {
      toast({ title: "Validation Error", description: "Please select a client", variant: "destructive" });
      return;
    }
    if (!selectedPolicyId || !selectedPolicy) {
      toast({ title: "Validation Error", description: "Please select a policy", variant: "destructive" });
      return;
    }

    try {
      const request = await createRequest.mutateAsync({
        client_id: clientId,
        carrier_id: selectedPolicy.carrier_id,
        policy_number: selectedPolicy.policy_number,
        coverage_type: selectedPolicy.coverage_type,
        policy_effective_date: policyEffectiveDate || undefined,
        policy_expiration_date: policyExpirationDate || undefined,
        notes: notes.trim() || undefined,
      });

      console.log("[NewRequestForm] Request created:", request.id);
      
      toast({
        title: "Request Created & Email Sent",
        description: `Loss run request has been created and sent to the carrier`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("[NewRequestForm] Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create request",
        variant: "destructive",
      });
    }
  };

  // Format policy option label
  const formatPolicyLabel = (policy: Policy) => {
    const coverageLabel = coverageTypeLabels[policy.coverage_type] || policy.coverage_type;
    const carrierName = policy.carriers?.name || "Unknown Carrier";
    return `${coverageLabel} – ${carrierName} – ${policy.policy_number}`;
  };

  const selectedClient = clients?.find((c) => c.id === clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Loss Run Request</DialogTitle>
          <DialogDescription>
            Select a policy to request loss run history. An email will be automatically sent to the carrier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Selection - Read-only if pre-selected */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            {isClientScoped && selectedClient ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <span className="font-medium">{selectedClient.name}</span>
              </div>
            ) : showNewClient ? (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  placeholder="Contact email (optional)"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateClient}
                    disabled={createClient.isPending}
                  >
                    {createClient.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Client
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewClient(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={clientId}
                  onValueChange={setClientId}
                  disabled={clientsLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={clientsLoading ? "Loading..." : "Select client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewClient(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Policy Selection - Primary change */}
          <div className="space-y-2">
            <Label htmlFor="policy">Policy *</Label>
            {!clientId ? (
              <p className="text-sm text-muted-foreground italic">Select a client first</p>
            ) : policiesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading policies...
              </div>
            ) : policies && policies.length > 0 ? (
              <Select
                value={selectedPolicyId}
                onValueChange={setSelectedPolicyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{formatPolicyLabel(policy)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 border border-dashed rounded-lg bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  No policies found for this client.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add a policy to the client first.
                </p>
              </div>
            )}
          </div>

          {/* Auto-filled fields - Read-only display */}
          {selectedPolicy && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                Policy Details (Auto-filled)
              </div>
              
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Carrier</Label>
                    <p className="font-medium">{selectedPolicy.carriers?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Coverage Type</Label>
                    <p className="font-medium">{coverageTypeLabels[selectedPolicy.coverage_type]}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Policy Number</Label>
                    <p className="font-mono font-medium">{selectedPolicy.policy_number}</p>
                  </div>
                </div>
                
                {selectedPolicy.carriers?.loss_run_email && (
                  <p className="text-xs text-muted-foreground">
                    Email will be sent to: {selectedPolicy.carriers.loss_run_email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Policy Dates - Editable overrides */}
          {selectedPolicy && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policy_effective_date">Effective Date</Label>
                <Input
                  id="policy_effective_date"
                  type="date"
                  value={policyEffectiveDate}
                  onChange={(e) => setPolicyEffectiveDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy_expiration_date">Expiration Date</Label>
                <Input
                  id="policy_expiration_date"
                  type="date"
                  value={policyExpirationDate}
                  onChange={(e) => setPolicyExpirationDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information for the request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createRequest.isPending || !selectedPolicy}
          >
            {createRequest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create & Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
