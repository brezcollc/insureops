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
import { Plus, ClipboardList, Loader2, Eye } from "lucide-react";
import { useLossRunsByClient } from "@/hooks/useClientLossRuns";
import { StatusBadge } from "@/components/StatusBadge";
import { NewRequestForm } from "@/components/NewRequestForm";
import { RequestDetailView } from "@/components/RequestDetailView";
import type { LossRunRequest } from "@/hooks/useLossRunRequests";

interface ClientLossRunsTabProps {
  clientId: string;
  clientName: string;
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

export function ClientLossRunsTab({ clientId, clientName }: ClientLossRunsTabProps) {
  const { data: requests, isLoading, refetch } = useLossRunsByClient(clientId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LossRunRequest | null>(null);

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
          <h3 className="text-lg font-semibold">Loss Run Requests</h3>
          <p className="text-sm text-muted-foreground">
            Track loss run requests for {clientName}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Request Loss Run
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Number</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Coverage Type</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(requests || []).map((request) => (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedRequest(request)}
              >
                <TableCell className="font-mono font-medium">
                  {request.policy_number}
                </TableCell>
                <TableCell>{request.carriers?.name || "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {coverageTypeLabels[request.coverage_type] || request.coverage_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(request.request_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!requests || requests.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">
                    No loss run requests yet. Click "Request Loss Run" to create one.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <NewRequestForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => refetch()}
        preselectedClientId={clientId}
      />

      <RequestDetailView
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  );
}
