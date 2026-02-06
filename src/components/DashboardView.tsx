import { StatCard } from "@/components/StatCard";
import { LossRunTable } from "@/components/LossRunTable";
import { FileText, CheckCircle, Clock, Building2 } from "lucide-react";
import { useClientsWithStats } from "@/hooks/useClients";
import { useLossRunRequests } from "@/hooks/useLossRunRequests";
import { SettingsView } from "@/components/SettingsView";
import { HelpSupportView } from "@/components/HelpSupportView";

interface DashboardViewProps {
  activeTab: string;
  searchQuery?: string;
}

export function DashboardView({ activeTab, searchQuery = "" }: DashboardViewProps) {
  const { data: clients } = useClientsWithStats();
  const { data: requests } = useLossRunRequests();

  // Calculate stats
  const activeClients = clients?.filter(c => c.status !== "archived").length || 0;
  const pendingRequests = requests?.filter(r => r.status === "requested" || r.status === "follow_up_sent").length || 0;
  const completedThisMonth = requests?.filter(r => {
    const date = new Date(r.created_at);
    const now = new Date();
    return r.status === "completed" && 
           date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  }).length || 0;

  if (activeTab === "settings") {
    return <SettingsView />;
  }

  if (activeTab === "help") {
    return <HelpSupportView />;
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
          title="Active Clients"
          value={activeClients}
          subtitle="Total clients in your portfolio"
          icon={Building2}
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          subtitle="Loss run requests awaiting response"
          icon={Clock}
          trend={pendingRequests > 0 ? { value: `${pendingRequests} open`, positive: false } : undefined}
        />
        <StatCard
          title="Completed This Month"
          value={completedThisMonth}
          subtitle="Loss runs completed"
          icon={CheckCircle}
        />
        <StatCard
          title="Total Requests"
          value={requests?.length || 0}
          subtitle="All time loss run requests"
          icon={FileText}
        />
      </div>

      {/* Recent Activity */}
      <LossRunTable searchQuery={searchQuery} />
    </div>
  );
}
