import { useState } from "react";
import { 
  Clock, AlertTriangle, Activity, Plus, Building2, FileText, 
  Send, ArrowRight, Calendar, Loader2, Eye, UserPlus, Shield
} from "lucide-react";
import { useLossRunRequests, LossRunRequest } from "@/hooks/useLossRunRequests";
import { SettingsView } from "@/components/SettingsView";
import { HelpSupportView } from "@/components/HelpSupportView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { NewRequestForm } from "@/components/NewRequestForm";
import { RequestDetailView } from "@/components/RequestDetailView";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { formatDistanceToNow } from "date-fns";

interface DashboardViewProps {
  activeTab: string;
  searchQuery?: string;
}

export function DashboardView({ activeTab, searchQuery = "" }: DashboardViewProps) {
  const { data: requests, isLoading } = useLossRunRequests();
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LossRunRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: clientCount } = useQuery({
    queryKey: ["clients_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .or("status.eq.active,status.is.null");
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch recent email logs for activity feed
  const { data: recentEmails } = useQuery({
    queryKey: ["recent_email_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*, loss_run_requests(*, clients(*), carriers(*))")
        .order("sent_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Fetch policies count
  const { data: policyCount } = useQuery({
    queryKey: ["policies_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("policies")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  if (activeTab === "settings") return <SettingsView />;
  if (activeTab === "help") return <HelpSupportView />;

  // Derived data
  const openRequests = requests?.filter(r => r.status === "requested" || r.status === "follow_up_sent") || [];
  const awaitingResponse = requests?.filter(r => r.status === "requested") || [];
  const followUpSent = requests?.filter(r => r.status === "follow_up_sent") || [];
  const recentlySent = requests
    ?.filter(r => {
      const daysSince = (Date.now() - new Date(r.request_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    })
    .slice(0, 5) || [];

  // Needs attention: older than 14 days and still open
  const staleRequests = openRequests.filter(r => {
    const daysSince = (Date.now() - new Date(r.request_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 14;
  });

  // Needs attention: requests without reviewed status that are received
  const receivedUnreviewed = requests?.filter(r => r.status === "received" && !r.reviewed_at) || [];

  const needsAttentionItems = [
    ...staleRequests.map(r => ({
      type: "stale" as const,
      request: r,
      label: `Open ${Math.floor((Date.now() - new Date(r.request_date).getTime()) / (1000 * 60 * 60 * 24))} days`,
      description: `${r.clients?.name} — ${r.carriers?.name}`,
    })),
    ...receivedUnreviewed.map(r => ({
      type: "unreviewed" as const,
      request: r,
      label: "Received, needs review",
      description: `${r.clients?.name} — ${r.carriers?.name}`,
    })),
  ].slice(0, 6);

  const handleViewRequest = (request: LossRunRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Operations Dashboard</h2>
        <p className="text-muted-foreground">Your work queue and operational overview</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button 
          variant="outline" 
          className="h-auto py-4 px-5 justify-start gap-3 border-2 border-border hover:border-primary/40 hover:shadow-sm transition-all"
          onClick={() => setIsNewRequestOpen(true)}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Request Loss Runs</p>
            <p className="text-xs text-muted-foreground">Send a new carrier request</p>
          </div>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 px-5 justify-start gap-3 border-2 border-border hover:border-primary/40 hover:shadow-sm transition-all"
          onClick={() => setIsClientFormOpen(true)}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <UserPlus className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Add Client</p>
            <p className="text-xs text-muted-foreground">Register a new insured</p>
          </div>
        </Button>
        <div className="h-auto py-4 px-5 flex items-center gap-3 rounded-md border-2 border-dashed border-border/60 bg-muted/30">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-muted-foreground">Add Policy</p>
            <p className="text-xs text-muted-foreground">Select a client first to add policies</p>
          </div>
        </div>
      </div>

      {/* Operational Summary Strips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Awaiting Response</span>
          </div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{awaitingResponse.length}</p>
        </div>
        <div className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Send className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Follow-Ups Sent</span>
          </div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{followUpSent.length}</p>
        </div>
        <div className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Active Clients</span>
          </div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{clientCount || 0}</p>
        </div>
        <div className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Policies</span>
          </div>
          <p className="text-2xl font-semibold text-foreground tabular-nums">{policyCount || 0}</p>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Open Requests + Needs Attention */}
        <div className="lg:col-span-2 space-y-6">
          {/* Open Requests */}
          <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Open Requests</h3>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                  {openRequests.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {openRequests.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No open requests — you're all caught up.
                </div>
              ) : (
                openRequests.slice(0, 8).map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleViewRequest(request)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {request.clients?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.carriers?.name} · {request.policy_number}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(request.request_date), { addSuffix: true })}
                    </span>
                    <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                ))
              )}
            </div>
            {openRequests.length > 8 && (
              <div className="px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  + {openRequests.length - 8} more open requests
                </p>
              </div>
            )}
          </div>

          {/* Needs Attention */}
          {needsAttentionItems.length > 0 && (
            <div className="rounded-xl border-2 border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-300/30">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full tabular-nums">
                  {needsAttentionItems.length}
                </span>
              </div>
              <div className="divide-y divide-amber-200/40 dark:divide-amber-800/30">
                {needsAttentionItems.map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-amber-100/30 dark:hover:bg-amber-900/10 cursor-pointer transition-colors"
                    onClick={() => handleViewRequest(item.request)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {item.label}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Sent */}
          {recentlySent.length > 0 && (
            <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Sent This Week</h3>
              </div>
              <div className="divide-y divide-border">
                {recentlySent.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleViewRequest(request)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {request.clients?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.carriers?.name} · {request.policy_number}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(request.request_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Activity Feed */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            </div>
            <div className="divide-y divide-border">
              {(!recentEmails || recentEmails.length === 0) ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No recent activity yet.
                </div>
              ) : (
                recentEmails.map((log) => {
                  const req = log.loss_run_requests as any;
                  const emailTypeLabel = log.email_type === "initial_request" 
                    ? "Request sent" 
                    : log.email_type === "follow_up" 
                    ? "Follow-up sent" 
                    : "Reminder sent";
                  return (
                    <div 
                      key={log.id} 
                      className="px-5 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if (req) {
                          setSelectedRequest(req);
                          setIsDetailOpen(true);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{emailTypeLabel}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {req?.clients?.name || "Unknown"} → {log.recipient}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="rounded-xl border-2 border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Portfolio Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Requests</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{requests?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {requests?.filter(r => r.status === "completed").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Received</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {requests?.filter(r => r.status === "received").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{openRequests.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NewRequestForm 
        open={isNewRequestOpen} 
        onOpenChange={setIsNewRequestOpen}
      />
      <ClientFormDialog
        open={isClientFormOpen}
        onOpenChange={setIsClientFormOpen}
      />
      <RequestDetailView
        request={selectedRequest}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
