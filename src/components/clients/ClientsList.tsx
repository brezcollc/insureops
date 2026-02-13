import { useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { useClientsWithStats, useArchiveClient, useRestoreClient } from "@/hooks/useClients";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import type { ClientWithStats } from "@/hooks/useClients";

type SortOption = "recent" | "alphabetical" | "pending" | "client_code";

const PAGE_SIZE = 15;

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
        <div className="flex items-center gap-1.5 text-primary">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Complete</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-destructive">
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
  const [committedSearch, setCommittedSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null);

  const executeSearch = useCallback(() => {
    setCommittedSearch(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setCommittedSearch("");
    setCurrentPage(1);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };

  // Reset to page 1 when sort or archived filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, showArchived]);

  const { data, isLoading, isFetching } = useClientsWithStats({
    includeArchived: showArchived,
    page: currentPage,
    pageSize: PAGE_SIZE,
    searchQuery: committedSearch,
    sortBy,
  });

  // Keep showing previous results while new data loads to prevent flickering
  const [stableData, setStableData] = useState(data);
  useEffect(() => {
    if (data && !isFetching) {
      setStableData(data);
    }
  }, [data, isFetching]);

  const displayData = stableData || data;
  
  const archiveClient = useArchiveClient();
  const restoreClient = useRestoreClient();

  const clients = displayData?.clients || [];
  const totalCount = displayData?.totalCount || 0;
  const totalPages = displayData?.totalPages || 1;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
            {totalCount} client{totalCount !== 1 ? "s" : ""}
            {isFetching && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search & Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, industry, or email..."
              className="pl-10 pr-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" className="h-9 px-3" onClick={executeSearch}>
            <Search className="w-4 h-4 mr-1.5" />
            Search
          </Button>
        </div>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="alphabetical">A–Z</SelectItem>
            <SelectItem value="pending">Most Pending</SelectItem>
            <SelectItem value="client_code">Client Code</SelectItem>
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

      {/* Client Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className={`group relative bg-card rounded-xl border-[1.5px] border-border/80 shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all duration-200 ${
              client.status === "archived" ? "opacity-60" : ""
            }`}
            onClick={() => onClientSelect(client.id)}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{client.name}</p>
                    {client.status === "archived" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">Archived</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {client.client_code && (
                      <span className="text-xs font-semibold text-foreground/70 font-mono bg-muted/80 border border-border/60 px-2 py-0.5 rounded">
                        {client.client_code}
                      </span>
                    )}
                    {client.industry && (
                      <span className="text-xs text-muted-foreground truncate">{client.industry}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-border/60">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium tabular-nums">{client.policy_count}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.policy_count === 1 ? "policy" : "policies"}
                  </span>
                </div>
                <div className="w-px h-4 bg-border" />
                <ProgressIndicator reviewed={client.reviewed_request_count} total={client.total_request_count} />
              </div>

              {/* Last Activity */}
              <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">{formatRelativeTime(client.last_activity)}</span>
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7 shadow-sm">
                    <MoreHorizontal className="w-3.5 h-3.5" />
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
                    <DropdownMenuItem onClick={() => restoreClient.mutate(client.id)} disabled={restoreClient.isPending}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => archiveClient.mutate(client.id)} disabled={archiveClient.isPending} className="text-destructive">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {clients.length === 0 && !isFetching && (
        <div className="text-center py-16 border border-dashed rounded-xl bg-muted/20">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-foreground mb-1">
            {committedSearch ? "No clients found" : "No clients yet"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {committedSearch ? "Try adjusting your search terms" : "Add your first client to get started"}
          </p>
          {!committedSearch && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1 || isFetching}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isFetching}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

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
