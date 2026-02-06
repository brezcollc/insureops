import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, MoreHorizontal, FileText, Loader2, Trash2, Edit } from "lucide-react";
import { usePoliciesByClient, useDeletePolicy } from "@/hooks/usePolicies";
import { PolicyFormDialog } from "@/components/clients/PolicyFormDialog";
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
  const deletePolicy = useDeletePolicy();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<Policy | null>(null);

  const handleDelete = async () => {
    if (!deletingPolicy) return;
    await deletePolicy.mutateAsync({ id: deletingPolicy.id, clientId });
    setDeletingPolicy(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Policies</h3>
          <p className="text-sm text-muted-foreground">
            Manage insurance policies for this client
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Number</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Coverage Type</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(policies || []).map((policy) => (
              <TableRow key={policy.id}>
                <TableCell className="font-mono font-medium max-w-[150px] truncate">
                  {policy.policy_number}
                </TableCell>
                <TableCell className="max-w-[120px] truncate">{policy.carriers?.name || "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {coverageTypeLabels[policy.coverage_type] || policy.coverage_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {policy.effective_date
                    ? new Date(policy.effective_date).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {policy.expiration_date
                    ? new Date(policy.expiration_date).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingPolicy(policy)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Policy
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingPolicy(policy)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {(!policies || policies.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium mb-1">No policies yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add policies to track loss run requests for this client.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
