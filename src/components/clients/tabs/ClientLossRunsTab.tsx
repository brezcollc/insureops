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
import { Plus, ClipboardList, Loader2, Eye, Send, Lock, CheckCircle2 } from "lucide-react";
import { useLossRunsByClient } from "@/hooks/useClientLossRuns";
import { StatusBadge } from "@/components/StatusBadge";
import { NewRequestForm } from "@/components/NewRequestForm";
import { RequestDetailView } from "@/components/RequestDetailView";
import { BatchLossRunDialog } from "@/components/clients/BatchLossRunDialog";
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
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LossRunRequest | null>(null);

  // Separate reviewed and open requests
  const reviewedRequests = (requests || []).filter(r => r.reviewed_at);
  const openRequests = (requests || []).filter(r => !r.reviewed_at);
  const totalRequests = requests?.length || 0;
  const reviewedCount = reviewedRequests.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderRequestRow = (request: LossRunRequest, isReviewed: boolean) => (
    <TableRow 
      key={request.id}
      className={`cursor-pointer hover:bg-muted/50 ${isReviewed ? 'bg-muted/30' : ''}`}
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
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          {isReviewed && (
            <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Lock className="w-3 h-3" />
              Reviewed
            </Badge>
          )}
        </div>
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Loss Run Requests</h3>
          <p className="text-sm text-muted-foreground">
            {totalRequests > 0 ? (
              <span className="flex items-center gap-2">
                <span>{reviewedCount} / {totalRequests} reviewed</span>
                {reviewedCount === totalRequests && totalRequests > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
              </span>
            ) : (
              `Track loss run requests for ${clientName}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Single Request
          </Button>
          <Button onClick={() => setIsBatchOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Request All
          </Button>
        </div>
      </div>

      {/* Open Requests Section */}
      {openRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            In Progress ({openRequests.length})
          </h4>
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
                {openRequests.map((request) => renderRequestRow(request, false))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Reviewed Requests Section */}
      {reviewedRequests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Reviewed ({reviewedRequests.length})
          </h4>
          <div className="card-elevated overflow-hidden border-green-200/50 dark:border-green-900/30">
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
                {reviewedRequests.map((request) => renderRequestRow(request, true))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalRequests === 0 && (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">
                    No loss run requests yet. Click "Single Request" or "Request All" to get started.
                  </p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <NewRequestForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => refetch()}
        preselectedClientId={clientId}
      />

      <BatchLossRunDialog
        open={isBatchOpen}
        onOpenChange={setIsBatchOpen}
        clientId={clientId}
        clientName={clientName}
        onSuccess={() => refetch()}
      />

      <RequestDetailView
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  );
}
