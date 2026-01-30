import { LossRunData } from "@/lib/api/lossRunParser";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText } from "lucide-react";

interface ParsedLossRunViewProps {
  data: LossRunData;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function ClaimStatusBadge({ status }: { status: "open" | "closed" | null }) {
  if (status === "open") {
    return <StatusBadge status="in-progress" />;
  }
  if (status === "closed") {
    return <StatusBadge status="completed" />;
  }
  return <span className="text-muted-foreground text-sm">—</span>;
}

export function ParsedLossRunView({ data }: ParsedLossRunViewProps) {
  const { claims } = data;

  // Calculate summary stats
  const totalClaims = claims.length;
  const openClaims = claims.filter(c => c.status === "open").length;
  const closedClaims = claims.filter(c => c.status === "closed").length;
  const totalPaid = claims.reduce((sum, c) => sum + (c.paid_amount || 0), 0);
  const totalIncurred = claims.reduce((sum, c) => sum + (c.incurred_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Claims</p>
          <p className="text-2xl font-semibold">{totalClaims}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-2xl font-semibold">{openClaims}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Closed</p>
          <p className="text-2xl font-semibold">{closedClaims}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Paid</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Incurred</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalIncurred)}</p>
        </div>
      </div>

      {/* Claims Table */}
      <div className="card-elevated overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Extracted Claims ({claims.length})</h3>
          <p className="text-sm text-muted-foreground">Data extracted exactly as written — requires licensed professional review</p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Date of Loss</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Reserved</th>
                <th className="text-right">Incurred</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim, index) => (
                <tr key={claim.claim_number || index}>
                  <td className="font-mono font-medium">{claim.claim_number || "—"}</td>
                  <td>{formatDate(claim.date_of_loss)}</td>
                  <td className="max-w-xs truncate">{claim.description || "—"}</td>
                  <td><ClaimStatusBadge status={claim.status} /></td>
                  <td className="text-right font-mono">{formatCurrency(claim.paid_amount)}</td>
                  <td className="text-right font-mono">{formatCurrency(claim.reserved_amount)}</td>
                  <td className="text-right font-mono font-medium">{formatCurrency(claim.incurred_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>Disclaimer:</strong> This data was extracted automatically and requires review by a licensed insurance professional before use. 
          All values are shown exactly as parsed from the source document.
        </p>
      </div>
    </div>
  );
}
