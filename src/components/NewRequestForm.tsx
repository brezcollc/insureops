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
import { Loader2, Plus, FileText, ArrowRight, ArrowLeft, Mail } from "lucide-react";
import {
  useClients,
  useCreateClient,
  CoverageType,
} from "@/hooks/useLossRunRequests";
import { usePoliciesByClient, Policy } from "@/hooks/usePolicies";
import { useCreateLossRunWithTemplate } from "@/hooks/useCreateLossRunWithTemplate";
import { emailTemplates, applyTemplate, formatCoverageType } from "@/lib/emailTemplates";

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

type Step = "details" | "compose";

export function NewRequestForm({ open, onOpenChange, onSuccess, preselectedClientId }: NewRequestFormProps) {
  const { toast } = useToast();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const createRequestWithTemplate = useCreateLossRunWithTemplate();
  const createClient = useCreateClient();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("details");

  // Details step state
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [policyEffectiveDate, setPolicyEffectiveDate] = useState("");
  const [policyExpirationDate, setPolicyExpirationDate] = useState("");
  const [notes, setNotes] = useState("");

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Compose step state
  const [selectedTemplateId, setSelectedTemplateId] = useState("initial_request");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Fetch policies for selected client
  const { data: policies, isLoading: policiesLoading } = usePoliciesByClient(clientId || null);

  // Get the selected policy details
  const selectedPolicy = useMemo(() => {
    if (!selectedPolicyId || !policies) return null;
    return policies.find((p) => p.id === selectedPolicyId) || null;
  }, [selectedPolicyId, policies]);

  const selectedClient = clients?.find((c) => c.id === clientId);

  // Check if we're in client-scoped mode (client pre-selected)
  const isClientScoped = !!preselectedClientId;

  // Template variables
  const templateVariables = useMemo(() => {
    const policyPeriod = policyEffectiveDate && policyExpirationDate
      ? `${policyEffectiveDate} to ${policyExpirationDate}`
      : "Please provide all available loss history";

    return {
      client_name: selectedClient?.name || "Unknown Client",
      policy_number: selectedPolicy?.policy_number || "",
      coverage_type: selectedPolicy ? formatCoverageType(selectedPolicy.coverage_type) : "",
      policy_period: policyPeriod,
      sender_name: "Insurance Operations Team",
      agency_name: "Acme Insurance Group",
    };
  }, [selectedClient, selectedPolicy, policyEffectiveDate, policyExpirationDate]);

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

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCurrentStep("details");
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
    setSelectedTemplateId("initial_request");
    setEmailSubject("");
    setEmailBody("");
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

  // Move to compose step
  const handleContinueToCompose = () => {
    if (!clientId || !selectedPolicyId || !selectedPolicy) {
      toast({ 
        title: "Validation Error", 
        description: "Please select a client and policy first", 
        variant: "destructive" 
      });
      return;
    }

    // Initialize email content from template
    const template = emailTemplates.find((t) => t.id === selectedTemplateId) || emailTemplates[0];
    const applied = applyTemplate(template, templateVariables);
    setEmailSubject(applied.subject);
    setEmailBody(applied.body);

    setCurrentStep("compose");
  };

  // Handle template change in compose step
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      const applied = applyTemplate(template, templateVariables);
      setEmailSubject(applied.subject);
      setEmailBody(applied.body);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPolicy || !emailSubject.trim() || !emailBody.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    try {
      await createRequestWithTemplate.mutateAsync({
        client_id: clientId,
        carrier_id: selectedPolicy.carrier_id,
        policy_number: selectedPolicy.policy_number,
        coverage_type: selectedPolicy.coverage_type,
        policy_effective_date: policyEffectiveDate || undefined,
        policy_expiration_date: policyExpirationDate || undefined,
        carrier_email: selectedPolicy.carrier_email,
        notes: notes.trim() || undefined,
        customSubject: emailSubject,
        customBody: emailBody,
        templateId: selectedTemplateId,
      });
      
      toast({
        title: "Request Created & Email Sent",
        description: `Loss run request has been created and sent to the carrier`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
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

  const isValidForCompose = !!clientId && !!selectedPolicyId && !!selectedPolicy;
  const isValidToSend = emailSubject.trim().length > 0 && emailBody.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === "details" ? (
              <>
                <FileText className="w-5 h-5" />
                Create Loss Run Request
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Compose Email
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "details" 
              ? "Select a policy to request loss run history." 
              : "Review and customize the email before sending."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === "details" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground"
          }`}>
            <span>1</span>
            <span>Details</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === "compose" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground"
          }`}>
            <span>2</span>
            <span>Compose Email</span>
          </div>
        </div>

        {currentStep === "details" ? (
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

            {/* Policy Selection */}
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
                  
                  <p className="text-xs text-muted-foreground">
                    Email will be sent to: {selectedPolicy.carrier_email}
                  </p>
                </div>
              </div>
            )}

            {/* Policy Dates */}
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
              <Label htmlFor="notes">Internal Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional information for internal tracking..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ) : (
          // Compose Step
          <div className="space-y-4 py-4">
            {/* Template Selector */}
            <div>
              <Label htmlFor="template">Email Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecting a template will update the content below.
              </p>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="email-subject">Subject *</Label>
              <Input
                id="email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="mt-1.5"
              />
            </div>

            {/* Body */}
            <div>
              <Label htmlFor="email-body">Message *</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter email message..."
                className="mt-1.5 min-h-[200px] font-mono text-sm"
              />
            </div>

            {/* Recipient info */}
            {selectedPolicy?.carriers?.loss_run_email && (
              <p className="text-xs text-muted-foreground">
                This email will be sent to: <span className="font-medium">{selectedPolicy.carriers.loss_run_email}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2 border-t">
          {currentStep === "compose" ? (
            <>
              <Button variant="outline" onClick={() => setCurrentStep("details")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createRequestWithTemplate.isPending || !isValidToSend}
                >
                  {createRequestWithTemplate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create & Send
                </Button>
              </div>
            </>
          ) : (
            <>
              <div />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinueToCompose} 
                  disabled={!isValidForCompose}
                >
                  Continue to Email
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
