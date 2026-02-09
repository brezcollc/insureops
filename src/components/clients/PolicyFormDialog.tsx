import { useState, useEffect, forwardRef } from "react";
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
import { Loader2 } from "lucide-react";
import { useCarriers, CoverageType } from "@/hooks/useLossRunRequests";
import { useCreatePolicy, useUpdatePolicy } from "@/hooks/usePolicies";
import type { Policy } from "@/hooks/usePolicies";

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  policy?: Policy | null;
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

export const PolicyFormDialog = forwardRef<HTMLDivElement, PolicyFormDialogProps>(
  function PolicyFormDialog({ open, onOpenChange, clientId, policy }, ref) {
    const { data: carriers, isLoading: carriersLoading } = useCarriers();
    const createPolicy = useCreatePolicy();
    const updatePolicy = useUpdatePolicy();
    const isEditing = !!policy;

    const [formData, setFormData] = useState({
      carrier_id: "",
      policy_number: "",
      coverage_type: "" as CoverageType | "",
      effective_date: "",
      expiration_date: "",
      carrier_email: "",
      notes: "",
    });

    useEffect(() => {
      if (policy) {
        setFormData({
          carrier_id: policy.carrier_id,
          policy_number: policy.policy_number,
          coverage_type: policy.coverage_type,
          effective_date: policy.effective_date || "",
          expiration_date: policy.expiration_date || "",
          carrier_email: policy.carrier_email || "",
          notes: policy.notes || "",
        });
      } else {
        setFormData({
          carrier_id: "",
          policy_number: "",
          coverage_type: "",
          effective_date: "",
          expiration_date: "",
          carrier_email: "",
          notes: "",
        });
      }
    }, [policy, open]);

    const handleSubmit = async () => {
      if (!formData.carrier_id || !formData.policy_number || !formData.coverage_type || !formData.carrier_email.trim()) return;

      if (isEditing && policy) {
        await updatePolicy.mutateAsync({
          id: policy.id,
          carrier_id: formData.carrier_id,
          policy_number: formData.policy_number.trim(),
          coverage_type: formData.coverage_type as CoverageType,
          effective_date: formData.effective_date || undefined,
          expiration_date: formData.expiration_date || undefined,
          carrier_email: formData.carrier_email.trim(),
          notes: formData.notes.trim() || undefined,
        });
      } else {
        await createPolicy.mutateAsync({
          client_id: clientId,
          carrier_id: formData.carrier_id,
          policy_number: formData.policy_number.trim(),
          coverage_type: formData.coverage_type as CoverageType,
          effective_date: formData.effective_date || undefined,
          expiration_date: formData.expiration_date || undefined,
          carrier_email: formData.carrier_email.trim(),
          notes: formData.notes.trim() || undefined,
        });
      }

      onOpenChange(false);
    };

    const isPending = createPolicy.isPending || updatePolicy.isPending;
    const isValid = formData.carrier_id && formData.policy_number.trim() && formData.coverage_type && formData.carrier_email.trim();

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Policy" : "Add New Policy"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the policy information below."
                : "Enter the policy details to add it to this client."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy_number">Policy Number *</Label>
              <Input
                id="policy_number"
                placeholder="e.g., WC-1234567"
                value={formData.policy_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, policy_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage_type">Coverage Type *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="carrier_email">Carrier Email *</Label>
              <Input
                id="carrier_email"
                type="email"
                placeholder="e.g., lossruns@carrier.com"
                value={formData.carrier_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, carrier_email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effective_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this policy..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !isValid}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Policy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
