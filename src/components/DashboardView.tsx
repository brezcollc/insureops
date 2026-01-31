import { StatCard } from "@/components/StatCard";
import { LossRunTable } from "@/components/LossRunTable";
import { DocumentIntake } from "@/components/DocumentIntake";
import { FileText, Upload, CheckCircle, Clock } from "lucide-react";

interface DashboardViewProps {
  activeTab: string;
  searchQuery?: string;
}

export function DashboardView({ activeTab, searchQuery = "" }: DashboardViewProps) {
  if (activeTab === "documents") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground">Document Intake</h2>
          <p className="text-muted-foreground">Upload and manage insurance documents for processing</p>
        </div>
        <DocumentIntake />
      </div>
    );
  }

  if (activeTab === "loss-runs") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground">Loss Run Requests</h2>
          <p className="text-muted-foreground">Track and manage all carrier loss run requests</p>
        </div>
        <LossRunTable searchQuery={searchQuery} />
      </div>
    );
  }

  if (activeTab === "data-prep") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground">Data Preparation</h2>
          <p className="text-muted-foreground">Review and structure extracted data for underwriting</p>
        </div>
        <div className="card-elevated p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Data Ready for Review</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload documents and complete loss run requests to see structured data here for review.
          </p>
        </div>
      </div>
    );
  }

  // Default: Dashboard view
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your insurance operations workflow</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pending Requests"
          value={12}
          subtitle="Loss run requests awaiting carrier response"
          icon={Clock}
          trend={{ value: "3 from yesterday", positive: false }}
        />
        <StatCard
          title="Documents Processed"
          value={48}
          subtitle="This week"
          icon={Upload}
          trend={{ value: "12% vs last week", positive: true }}
        />
        <StatCard
          title="Completed This Month"
          value={127}
          subtitle="Loss runs and document intakes"
          icon={CheckCircle}
        />
        <StatCard
          title="Avg. Turnaround"
          value="3.2 days"
          subtitle="From request to completion"
          icon={FileText}
          trend={{ value: "0.5 days faster", positive: true }}
        />
      </div>

      {/* Recent Activity */}
      <LossRunTable searchQuery={searchQuery} />
    </div>
  );
}
