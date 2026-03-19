import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LossRunAnalysis } from "@/hooks/useLossRunAnalysis";

interface LossRunAnalysisPanelProps {
  analysis: LossRunAnalysis;
}

const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
};

const TrendIcon = ({ trend }: { trend: LossRunAnalysis["trend"] }) => {
  if (trend === "increasing") return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (trend === "decreasing") return <TrendingDown className="w-4 h-4 text-green-500" />;
  if (trend === "stable") return <Minus className="w-4 h-4 text-blue-500" />;
  return null;
};

const TrendBadge = ({ trend }: { trend: LossRunAnalysis["trend"] }) => {
  if (!trend || trend === "insufficient_data") return null;
  const config = {
    increasing: { label: "Increasing Losses", className: "bg-red-50 text-red-700 border-red-200" },
    decreasing: { label: "Improving Trend", className: "bg-green-50 text-green-700 border-green-200" },
    stable: { label: "Stable", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const { label, className } = config[trend];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      <TrendIcon trend={trend} />
      {label}
    </span>
  );
};

export function LossRunAnalysisPanel({ analysis }: LossRunAnalysisPanelProps) {
  if (analysis.status === "processing" || analysis.status === "pending") {
    return (
      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Claude is analyzing this loss run...</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">This usually takes 15–30 seconds.</p>
      </div>
    );
  }

  if (analysis.status === "failed") {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Analysis failed</span>
        </div>
        <p className="text-xs text-red-600 mt-1">{analysis.error_message || "Please try again."}</p>
      </div>
    );
  }

  if (analysis.status !== "completed") return null;

  return (
    <div className="mt-3 border border-blue-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">AI Loss Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {analysis.policy_period && (
            <span className="text-xs text-blue-600">{analysis.policy_period}</span>
          )}
          <TrendBadge trend={analysis.trend} />
        </div>
      </div>

      <div className="p-4 space-y-4 bg-white">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Total Claims</p>
            <p className="text-xl font-bold text-foreground">{analysis.total_claims ?? "—"}</p>
            {(analysis.open_claims !== null || analysis.closed_claims !== null) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {analysis.open_claims ?? 0} open · {analysis.closed_claims ?? 0} closed
              </p>
            )}
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Total Incurred</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(analysis.total_incurred)}</p>
            {analysis.total_paid !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(analysis.total_paid)} paid</p>
            )}
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Open Reserves</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(analysis.total_reserved)}</p>
            {analysis.open_claims !== null && analysis.open_claims > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{analysis.open_claims} open {analysis.open_claims === 1 ? "claim" : "claims"}</p>
            )}
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Largest Claim</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(analysis.largest_claim_amount)}</p>
            {analysis.largest_claim_date && (
              <p className="text-xs text-muted-foreground mt-0.5">{analysis.largest_claim_date}</p>
            )}
          </div>
        </div>

        {/* Largest Claim Description */}
        {analysis.largest_claim_description && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
            <span className="font-medium">Largest claim: </span>{analysis.largest_claim_description}
          </div>
        )}

        {/* Year-by-Year Breakdown */}
        {analysis.yearly_breakdown && analysis.yearly_breakdown.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Year-by-Year</p>
            <div className="space-y-1.5">
              {analysis.yearly_breakdown.map((row) => {
                const maxIncurred = Math.max(...analysis.yearly_breakdown!.map(r => r.total_incurred || 0));
                const barWidth = maxIncurred > 0 ? Math.round(((row.total_incurred || 0) / maxIncurred) * 100) : 0;
                return (
                  <div key={row.year} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-foreground w-10 shrink-0">{row.year}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-blue-400 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground w-20 text-right shrink-0">{formatCurrency(row.total_incurred)}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{row.claims} {row.claims === 1 ? "claim" : "claims"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Risk Observations */}
        {analysis.risk_observations && analysis.risk_observations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Observations</p>
            <ul className="space-y-1.5">
              {analysis.risk_observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-muted">
          <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Analyzed by Claude AI · {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString() : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
