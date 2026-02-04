import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { MoreHorizontal, Eye, RefreshCw, Plus, Loader2, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLossRunRequests, LossRunRequest, useUpdateLossRunStatus, useResendEmail } from "@/hooks/useLossRunRequests";
import { NewRequestForm } from "@/components/NewRequestForm";
import { RequestDetailView } from "@/components/RequestDetailView";

interface LossRunTableProps {
  searchQuery?: string;
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

export function LossRunTable({ searchQuery = "" }: LossRunTableProps) {
  const { toast } = useToast();
  const { data: requests, isLoading, refetch, isRefetching } = useLossRunRequests();
  const updateStatus = useUpdateLossRunStatus();
  const resendEmail = useResendEmail();
  
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LossRunRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter requests based on search query
  const filteredRequests = (requests || []).filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.policy_number.toLowerCase().includes(query) ||
      request.clients?.name.toLowerCase().includes(query) ||
      request.carriers?.name.toLowerCase().includes(query) ||
      request.coverage_type.toLowerCase().includes(query)
    );
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = () => {
    console.log("[LossRunTable] Refresh button clicked");
    refetch();
    toast({
      title: "Refreshing...",
      description: "Fetching latest loss run requests",
    });
  };

  const handleNewRequest = () => {
    console.log("[LossRunTable] New Request button clicked");
    setIsNewRequestOpen(true);
  };

  const handleViewRequest = (request: LossRunRequest) => {
    console.log("[LossRunTable] View button clicked for:", request.id);
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const handleRowClick = (request: LossRunRequest) => {
    console.log("[LossRunTable] Row clicked:", request.id);
    handleViewRequest(request);
  };

  const handleMenuAction = async (action: string, request: LossRunRequest) => {
    console.log(`[LossRunTable] Menu action "${action}" clicked for:`, request.id);
    
    switch (action) {
      case "resend":
        try {
          await resendEmail.mutateAsync(request);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to resend email",
            variant: "destructive",
          });
        }
        break;
      case "mark_received":
        try {
          await updateStatus.mutateAsync({ id: request.id, status: "received" });
          toast({ title: "Status Updated", description: "Request marked as received" });
        } catch (error) {
          toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
        break;
      case "mark_completed":
        try {
          await updateStatus.mutateAsync({ id: request.id, status: "completed" });
          toast({ title: "Status Updated", description: "Request marked as completed" });
        } catch (error) {
          toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
        break;
      default:
        toast({
          title: `${action}`,
          description: `Action triggered for ${request.clients?.name || "Unknown"}`,
        });
    }
  };

  const handlePreviousPage = () => {
    console.log("[LossRunTable] Previous page clicked");
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    console.log("[LossRunTable] Next page clicked");
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="card-elevated p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="card-elevated overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Loss Run Requests</h3>
            <p className="text-sm text-muted-foreground">Manage and track all loss run requests</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Carrier</th>
                <th>Policy Number</th>
                <th>Coverage Type</th>
                <th>Request Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((request) => (
                <tr 
                  key={request.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(request)}
                >
                  <td className="font-medium text-foreground">
                    {request.clients?.name || "Unknown"}
                  </td>
                  <td>{request.carriers?.name || "Unknown"}</td>
                  <td className="font-mono text-sm">{request.policy_number}</td>
                  <td>{coverageTypeLabels[request.coverage_type] || request.coverage_type}</td>
                  <td>{new Date(request.request_date).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={request.status} />
                      {request.reviewed_at && (
                        <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Lock className="w-3 h-3" />
                          Reviewed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRequest(request);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMenuAction("resend", request)}>
                          Resend Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMenuAction("mark_received", request)}>
                          Mark as Received
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMenuAction("mark_completed", request)}>
                          Mark as Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No requests match your search" : "No loss run requests yet. Click 'New Request' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedRequests.length} of {filteredRequests.length} requests
            {searchQuery && ` (filtered from ${requests?.length || 0})`}
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={handlePreviousPage}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage >= totalPages}
              onClick={handleNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* New Request Form */}
      <NewRequestForm 
        open={isNewRequestOpen} 
        onOpenChange={setIsNewRequestOpen}
        onSuccess={() => refetch()}
      />

      {/* Request Detail View */}
      <RequestDetailView
        request={selectedRequest}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
