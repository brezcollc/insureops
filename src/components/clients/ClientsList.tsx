import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Building2, 
  Archive, 
  RotateCcw,
  FileText,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Clock,
  AlertCircle
} from "lucide-react";
import { useClientsWithStats, useArchiveClient, useRestoreClient } from "@/hooks/useClients";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import type { ClientWithStats } from "@/hooks/useClients";

type SortOption = "recent" | "alphabetical" | "pending";

// Compact progress indicator
function ProgressIndicator({ reviewed, total }: { reviewed: number; total: number }) {
  if (total === 0) {
    return (
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted" />
        No requests
      </span>
    );
  }
  
  const isComplete = reviewed === total;
  const pending = total - reviewed;
  
  return (
    <div className="flex items-center gap-2">
      {isComplete ? (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Complete</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-amber-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{pending} pending</span>
        </div>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">
        ({reviewed}/{total})
      </span>
    </div>
  );
}

// Relative time formatter
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

interface ClientsListProps {
  onClientSelect: (clientId: string) => void;
}

export function ClientsList({ onClientSelect }: ClientsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null);

  const { data: clients, isLoading } = useClientsWithStats(showArchived);
  const archiveClient = useArchiveClient();
  const restoreClient = useRestoreClient();

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let result = (clients || []).filter((client) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        client.name.toLowerCase().includes(query) ||
        client.industry?.toLowerCase().includes(query) ||
        client.contact_email?.toLowerCase().includes(query)
      );
    });

    // Sort based on selected option
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => {
          const aDate = a.last_activity || a.updated_at || a.created_at;
          const bDate = b.last_activity || b.updated_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
        break;
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "pending":
        result.sort((a, b) => b.open_request_count - a.open_request_count);
        break;
    }

    return result;
  }, [clients, searchQuery, sortBy]);

  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.status !== "archived").length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground">
            {activeClients} active client{activeClients !== 1 ? "s" : ""}
            {showArchived && totalClients > activeClients && (
              <span className="ml-1">• {totalClients - activeClients} archived</span>
            )}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search & Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, industry, or email..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="alphabetical">A–Z</SelectItem>
            <SelectItem value="pending">Most Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
            className="scale-90"
          />
          <Label htmlFor="show-archived" className="text-xs text-muted-foreground cursor-pointer">
            Archived
          </Label>
        </div>
      </div>

      {/* Client List - Dense Card Layout */}
      <div className="space-y-1">
        {filteredAndSortedClients.map((client) => (
          <div
            key={client.id}
            className={`group flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer transition-all ${
              client.status === "archived" ? "opacity-60" : ""
            }`}
            onClick={() => onClientSelect(client.id)}
          >
            {/* Client Icon & Name */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{client.name}</p>
                  {client.status === "archived" && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      Archived
                    </Badge>
                  )}
                </div>
                {client.industry && (
                  <p className="text-xs text-muted-foreground truncate">{client.industry}</p>
                )}
              </div>
            </div>

            {/* Policies */}
            <div className="hidden sm:flex items-center gap-1.5 min-w-[80px]">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm tabular-nums">
                {client.policy_count}
                <span className="text-muted-foreground text-xs ml-0.5">
                  {client.policy_count === 1 ? "policy" : "policies"}
                </span>
              </span>
            </div>

            {/* Loss Run Progress */}
            <div className="hidden md:block min-w-[140px]">
              <ProgressIndicator 
                reviewed={client.reviewed_request_count} 
                total={client.total_request_count} 
              />
            </div>

            {/* Last Activity */}
            <div className="hidden lg:flex items-center gap-1.5 min-w-[80px] text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{formatRelativeTime(client.last_activity)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onClientSelect(client.id)}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditingClient(client)}>
                    Edit Client
                  </DropdownMenuItem>
                  {client.status === "archived" ? (
                    <DropdownMenuItem 
                      onClick={() => restoreClient.mutate(client.id)}
                      disabled={restoreClient.isPending}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => archiveClient.mutate(client.id)}
                      disabled={archiveClient.isPending}
                      className="text-destructive"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredAndSortedClients.length === 0 && (
          <div className="text-center py-16 border border-dashed rounded-lg bg-muted/20">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground mb-1">
              {searchQuery ? "No clients found" : "No clients yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Add your first client to get started"}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ClientFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {editingClient && (
        <ClientFormDialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
        />
      )}
    </div>
  );
}
