import { LossRunData, LossRunClaim } from "@/lib/api/lossRunParser";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Building, Calendar, DollarSign } from "lucide-react";

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

function ClaimStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes("open")) {
    return <StatusBadge status="in-progress" />;
  }
  if (normalizedStatus.includes("closed")) {
    return <StatusBadge status="completed" />;
  }
  return <StatusBadge status="review" />;
}

export function ParsedLossRunView({ data }: ParsedLossRunViewProps) {
  const { document_info, claims, summary } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Document Info Header */}
      <div className="card-elevated p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{document_info.insured_name}</h3>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Carrier</p>
                <p className="font-medium">{document_info.carrier_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Policy Number</p>
                <p className="font-mono font-medium">{document_info.policy_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Line of Business</p>
                <p className="font-medium">{document_info.line_of_business || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Report Date</p>
                <p className="font-medium">{formatDate(document_info.report_date)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Claims</p>
            <p className="text-2xl font-semibold">{summary.total_claims ?? claims.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Open Claims</p>
            <p className="text-2xl font-semibold">{summary.open_claims ?? "—"}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-semibold">{formatCurrency(summary.total_paid)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Incurred</p>
            <p className="text-2xl font-semibold">{formatCurrency(summary.total_incurred)}</p>
          </div>
        </div>
      )}

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
                <th>Status</th>
                <th>Date of Loss</th>
                <th>Claimant</th>
                <th>Cause of Loss</th>
                <th className="text-right">Total Paid</th>
                <th className="text-right">Total Reserved</th>
                <th className="text-right">Total Incurred</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim, index) => (
                <tr key={claim.claim_number || index}>
                  <td className="font-mono font-medium">{claim.claim_number}</td>
                  <td><ClaimStatusBadge status={claim.claim_status} /></td>
                  <td>{formatDate(claim.date_of_loss)}</td>
                  <td>{claim.claimant_name || "—"}</td>
                  <td className="max-w-xs truncate">{claim.cause_of_loss || "—"}</td>
                  <td className="text-right font-mono">{formatCurrency(claim.total_paid)}</td>
                  <td className="text-right font-mono">{formatCurrency(claim.total_reserved)}</td>
                  <td className="text-right font-mono font-medium">{formatCurrency(claim.total_incurred)}</td>
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
