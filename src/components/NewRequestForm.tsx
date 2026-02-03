import React, { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import {
  useClients,
  useCarriers,
  useCreateLossRunRequest,
  useCreateClient,
  CoverageType,
} from "@/hooks/useLossRunRequests";

interface NewRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedClientId?: string;
}

const coverageTypes: { value: CoverageType; label: string }[] = [
  { value: "general_liability", label: "General Liability" },
  { value: "workers_compensation", label: "Workers' Compensation" },
  { value: "commercial_auto", label: "Commercial Auto" },
  { value: "commercial_property", label: "Commercial Property" },
  { value: "professional_liability", label: "Professional Liability" },
  { value: "umbrella", label: "Umbrella" },
  { value: "other", label: "Other" },
];

export function NewRequestForm({ open, onOpenChange, onSuccess, preselectedClientId }: NewRequestFormProps) {
  const { toast } = useToast();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: carriers, isLoading: carriersLoading } = useCarriers();
  const createRequest = useCreateLossRunRequest();
  const createClient = useCreateClient();

  const [formData, setFormData] = useState({
    client_id: preselectedClientId || "",
    carrier_id: "",
    policy_number: "",
    coverage_type: "" as CoverageType | "",
    policy_effective_date: "",
    policy_expiration_date: "",
    notes: "",
  });

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Update client_id when preselectedClientId changes
  React.useEffect(() => {
    if (preselectedClientId && open) {
      setFormData((prev) => ({ ...prev, client_id: preselectedClientId }));
    }
  }, [preselectedClientId, open]);

  const resetForm = () => {
    setFormData({
      client_id: "",
      carrier_id: "",
      policy_number: "",
      coverage_type: "",
      policy_effective_date: "",
      policy_expiration_date: "",
      notes: "",
    });
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
      
      setFormData((prev) => ({ ...prev, client_id: client.id }));
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
    console.log("[NewRequestForm] Submit clicked", formData);

    // Validation
    if (!formData.client_id) {
      toast({ title: "Validation Error", description: "Please select a client", variant: "destructive" });
      return;
    }
    if (!formData.carrier_id) {
      toast({ title: "Validation Error", description: "Please select a carrier", variant: "destructive" });
      return;
    }
    if (!formData.policy_number.trim()) {
      toast({ title: "Validation Error", description: "Policy number is required", variant: "destructive" });
      return;
    }
    if (!formData.coverage_type) {
      toast({ title: "Validation Error", description: "Please select a coverage type", variant: "destructive" });
      return;
    }

    try {
      const request = await createRequest.mutateAsync({
        client_id: formData.client_id,
        carrier_id: formData.carrier_id,
        policy_number: formData.policy_number.trim(),
        coverage_type: formData.coverage_type as CoverageType,
        policy_effective_date: formData.policy_effective_date || undefined,
        policy_expiration_date: formData.policy_expiration_date || undefined,
        notes: formData.notes.trim() || undefined,
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

  const selectedCarrier = carriers?.find((c) => c.id === formData.carrier_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Loss Run Request</DialogTitle>
          <DialogDescription>
            Submit a new loss run request. An email will be automatically sent to the carrier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            {showNewClient ? (
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
                  value={formData.client_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, client_id: value }))}
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

          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier *</Label>
            <Select
              value={formData.carrier_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, carrier_id: value }))}
              disabled={carriersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={carriersLoading ? "Loading..." : "Select carrier"} />
              </SelectTrigger>
              <SelectContent>
                {carriers?.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCarrier && (
              <p className="text-xs text-muted-foreground">
                Email will be sent to: {selectedCarrier.loss_run_email}
              </p>
            )}
          </div>

          {/* Policy Number */}
          <div className="space-y-2">
            <Label htmlFor="policy_number">Policy Number *</Label>
            <Input
              id="policy_number"
              placeholder="e.g., WC-1234567"
              value={formData.policy_number}
              onChange={(e) => setFormData((prev) => ({ ...prev, policy_number: e.target.value }))}
            />
          </div>

          {/* Coverage Type */}
          <div className="space-y-2">
            <Label htmlFor="coverage_type">Coverage Type / Line of Business *</Label>
            <Select
              value={formData.coverage_type}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, coverage_type: value as CoverageType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select coverage type" />
              </SelectTrigger>
              <SelectContent>
                {coverageTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Policy Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policy_effective_date">Effective Date</Label>
              <Input
                id="policy_effective_date"
                type="date"
                value={formData.policy_effective_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, policy_effective_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy_expiration_date">Expiration Date</Label>
              <Input
                id="policy_expiration_date"
                type="date"
                value={formData.policy_expiration_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, policy_expiration_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information for the request..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create & Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
