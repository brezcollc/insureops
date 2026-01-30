import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { MoreHorizontal, Eye, RefreshCw } from "lucide-react";

interface LossRunRequest {
  id: string;
  insuredName: string;
  carrier: string;
  policyNumber: string;
  requestDate: string;
  status: "pending" | "in-progress" | "completed" | "review";
  dueDate: string;
}

const mockRequests: LossRunRequest[] = [
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

export function LossRunTable() {
  return (
    <div className="card-elevated overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Loss Run Requests</h3>
          <p className="text-sm text-muted-foreground">Manage and track all loss run requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            + New Request
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
            {mockRequests.map((request) => (
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
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">Showing 5 of 24 requests</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}
