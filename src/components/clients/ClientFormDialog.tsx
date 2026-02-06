import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { useCreateClient, useUpdateClient } from "@/hooks/useClients";
import type { Client } from "@/hooks/useClients";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isEditing = !!client;

  const [formData, setFormData] = useState({
    name: "",
    client_code: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    industry: "",
    internal_notes: "",
    renewal_date: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        client_code: client.client_code || "",
        contact_email: client.contact_email || "",
        contact_phone: client.contact_phone || "",
        address: client.address || "",
        industry: client.industry || "",
        internal_notes: client.internal_notes || "",
        renewal_date: client.renewal_date || "",
      });
    } else {
      setFormData({
        name: "",
        client_code: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        industry: "",
        internal_notes: "",
        renewal_date: "",
      });
    }
  }, [client, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (isEditing && client) {
      await updateClient.mutateAsync({
        id: client.id,
        name: formData.name.trim(),
        client_code: formData.client_code.trim() || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        internal_notes: formData.internal_notes.trim() || undefined,
        renewal_date: formData.renewal_date || undefined,
      });
    } else {
      await createClient.mutateAsync({
        name: formData.name.trim(),
        client_code: formData.client_code.trim() || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        internal_notes: formData.internal_notes.trim() || undefined,
        renewal_date: formData.renewal_date || undefined,
      });
    }

    onOpenChange(false);
  };

  const isPending = createClient.isPending || updateClient.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the client's information below."
              : "Enter the client's information to add them to your system."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_code">Client Code</Label>
              <Input
                id="client_code"
                placeholder="e.g., ACME-001"
                value={formData.client_code}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_code: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Optional internal identifier
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                placeholder="(555) 123-4567"
                value={formData.contact_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Manufacturing"
                value={formData.industry}
                onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewal_date">Renewal Date</Label>
              <Input
                id="renewal_date"
                type="date"
                value={formData.renewal_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, renewal_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, City, State ZIP"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              placeholder="Notes about this client..."
              rows={3}
              value={formData.internal_notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, internal_notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !formData.name.trim()}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Add Client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
