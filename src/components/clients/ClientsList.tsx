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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  CheckCircle2
} from "lucide-react";
import { useClientsWithStats, useArchiveClient, useRestoreClient } from "@/hooks/useClients";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import type { ClientWithStats } from "@/hooks/useClients";

// Progress indicator component
function ProgressIndicator({ reviewed, total }: { reviewed: number; total: number }) {
  if (total === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  
  const isComplete = reviewed === total;
  const progressPercent = Math.round((reviewed / total) * 100);
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
        <span className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-foreground'}`}>
          {reviewed} / {total}
        </span>
      </div>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete 
              ? 'bg-green-500' 
              : progressPercent > 0 
                ? 'bg-primary' 
                : 'bg-muted'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

interface ClientsListProps {
  onClientSelect: (clientId: string) => void;
}

export function ClientsList({ onClientSelect }: ClientsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null);

  const { data: clients, isLoading } = useClientsWithStats(showArchived);
  const archiveClient = useArchiveClient();
  const restoreClient = useRestoreClient();

  const filteredClients = (clients || []).filter((client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.industry?.toLowerCase().includes(query) ||
      client.contact_email?.toLowerCase().includes(query)
    );
  });

  const handleRowClick = (client: ClientWithStats) => {
    onClientSelect(client.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Clients</h2>
          <p className="text-muted-foreground">Manage your insurance clients and their policies</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <Label htmlFor="show-archived" className="text-sm text-muted-foreground">
            Show archived
          </Label>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="text-center">Policies</TableHead>
              <TableHead>Loss Run Progress</TableHead>
              <TableHead>Renewal Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(client)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      {client.contact_email && (
                        <p className="text-xs text-muted-foreground">{client.contact_email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.industry || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{client.policy_count}</Badge>
                </TableCell>
                <TableCell>
                  <ProgressIndicator 
                    reviewed={client.reviewed_request_count} 
                    total={client.total_request_count} 
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.renewal_date
                    ? new Date(client.renewal_date).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {client.status === "archived" ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Archived
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-success/10 text-success border-0">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No clients match your search"
                      : "No clients yet. Click 'Add Client' to get started."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
