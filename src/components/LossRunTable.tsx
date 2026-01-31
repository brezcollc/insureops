import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { MoreHorizontal, Eye, RefreshCw, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface LossRunRequest {
  id: string;
  insuredName: string;
  carrier: string;
  policyNumber: string;
  requestDate: string;
  status: "pending" | "in-progress" | "completed" | "review";
  dueDate: string;
}

const initialRequests: LossRunRequest[] = [
  {
    id: "LR-2024-001",
    insuredName: "Acme Corporation",
    carrier: "Liberty Mutual",
    policyNumber: "WC-4892716",
    requestDate: "2024-01-15",
    status: "completed",
    dueDate: "2024-01-25",
  },
  {
    id: "LR-2024-002",
    insuredName: "TechStart Inc.",
    carrier: "Travelers",
    policyNumber: "GL-7291034",
    requestDate: "2024-01-18",
    status: "in-progress",
    dueDate: "2024-01-28",
  },
  {
    id: "LR-2024-003",
    insuredName: "BuildRight Construction",
    carrier: "Hartford",
    policyNumber: "CP-3847291",
    requestDate: "2024-01-20",
    status: "pending",
    dueDate: "2024-01-30",
  },
  {
    id: "LR-2024-004",
    insuredName: "Fresh Foods LLC",
    carrier: "CNA",
    policyNumber: "BOP-9182736",
    requestDate: "2024-01-22",
    status: "review",
    dueDate: "2024-02-01",
  },
  {
    id: "LR-2024-005",
    insuredName: "Metro Logistics",
    carrier: "Zurich",
    policyNumber: "CA-5647382",
    requestDate: "2024-01-23",
    status: "pending",
    dueDate: "2024-02-02",
  },
];

interface LossRunTableProps {
  searchQuery?: string;
}

export function LossRunTable({ searchQuery = "" }: LossRunTableProps) {
  const [requests, setRequests] = useState<LossRunRequest[]>(initialRequests);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LossRunRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Form state for new request
  const [newRequest, setNewRequest] = useState({
    insuredName: "",
    carrier: "",
    policyNumber: "",
    dueDate: "",
  });

  // Filter requests based on search query
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.id.toLowerCase().includes(query) ||
      request.insuredName.toLowerCase().includes(query) ||
      request.carrier.toLowerCase().includes(query) ||
      request.policyNumber.toLowerCase().includes(query)
    );
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = () => {
    console.log("[LossRunTable] Refresh button clicked");
    setIsRefreshing(true);
    toast({
      title: "Refreshing...",
      description: "Fetching latest loss run requests",
    });
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Loss run requests are up to date",
      });
      console.log("[LossRunTable] Refresh complete");
    }, 1000);
  };

  const handleNewRequest = () => {
    console.log("[LossRunTable] New Request button clicked");
    setIsNewRequestOpen(true);
  };

  const handleViewRequest = (request: LossRunRequest) => {
    console.log("[LossRunTable] View button clicked for:", request.id);
    setSelectedRequest(request);
    setIsViewOpen(true);
  };

  const handleCreateRequest = () => {
    console.log("[LossRunTable] Create Request submitted:", newRequest);
    
    if (!newRequest.insuredName || !newRequest.carrier || !newRequest.policyNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newId = `LR-2024-${String(requests.length + 1).padStart(3, "0")}`;
    const createdRequest: LossRunRequest = {
      id: newId,
      insuredName: newRequest.insuredName,
      carrier: newRequest.carrier,
      policyNumber: newRequest.policyNumber,
      requestDate: new Date().toISOString().split("T")[0],
      status: "pending",
      dueDate: newRequest.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    setRequests((prev) => [createdRequest, ...prev]);
    setIsNewRequestOpen(false);
    setNewRequest({ insuredName: "", carrier: "", policyNumber: "", dueDate: "" });
    
    toast({
      title: "Request Created",
      description: `Loss run request ${newId} has been created`,
    });
    console.log("[LossRunTable] Request created successfully:", newId);
  };

  const handleMenuAction = (action: string, request: LossRunRequest) => {
    console.log(`[LossRunTable] Menu action "${action}" clicked for:`, request.id);
    toast({
      title: `${action} - ${request.id}`,
      description: `Action "${action}" triggered for ${request.insuredName}`,
    });
  };

  const handlePreviousPage = () => {
    console.log("[LossRunTable] Previous page clicked");
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    console.log("[LossRunTable] Next page clicked");
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

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
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
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
                <th>Request ID</th>
                <th>Insured Name</th>
                <th>Carrier</th>
                <th>Policy Number</th>
                <th>Request Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((request) => (
                <tr key={request.id}>
                  <td className="font-medium text-foreground">{request.id}</td>
                  <td>{request.insuredName}</td>
                  <td>{request.carrier}</td>
                  <td className="font-mono text-sm">{request.policyNumber}</td>
                  <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td>{new Date(request.dueDate).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMenuAction("Edit", request)}>
                          Edit Request
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMenuAction("Duplicate", request)}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMenuAction("Send Reminder", request)}>
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleMenuAction("Delete", request)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No requests match your search" : "No requests found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedRequests.length} of {filteredRequests.length} requests
            {searchQuery && ` (filtered from ${requests.length})`}
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

      {/* New Request Dialog */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Loss Run Request</DialogTitle>
            <DialogDescription>
              Submit a new loss run request to a carrier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="insuredName">Insured Name *</Label>
              <Input
                id="insuredName"
                placeholder="e.g., Acme Corporation"
                value={newRequest.insuredName}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, insuredName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier *</Label>
              <Select
                value={newRequest.carrier}
                onValueChange={(value) => setNewRequest((prev) => ({ ...prev, carrier: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Liberty Mutual">Liberty Mutual</SelectItem>
                  <SelectItem value="Travelers">Travelers</SelectItem>
                  <SelectItem value="Hartford">Hartford</SelectItem>
                  <SelectItem value="CNA">CNA</SelectItem>
                  <SelectItem value="Zurich">Zurich</SelectItem>
                  <SelectItem value="AIG">AIG</SelectItem>
                  <SelectItem value="Chubb">Chubb</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                id="policyNumber"
                placeholder="e.g., WC-1234567"
                value={newRequest.policyNumber}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, policyNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newRequest.dueDate}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>
              Create Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details - {selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              Loss run request information
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Insured Name</p>
                  <p className="font-medium">{selectedRequest.insuredName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium">{selectedRequest.carrier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-mono">{selectedRequest.policyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Request Date</p>
                  <p className="font-medium">{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
