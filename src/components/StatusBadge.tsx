import { cn } from "@/lib/utils";

type StatusType = "pending" | "in-progress" | "completed" | "review" | "requested" | "follow_up_sent" | "received";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string; dotColor: string }> = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border/60",
    dotColor: "bg-muted-foreground/50",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-status-in-progress-bg text-status-in-progress border-status-in-progress/20",
    dotColor: "bg-status-in-progress",
  },
  completed: {
    label: "Completed",
    className: "bg-status-completed-bg text-status-completed border-status-completed/20",
    dotColor: "bg-status-completed",
  },
  review: {
    label: "Under Review",
    className: "bg-muted text-muted-foreground border-border/60",
    dotColor: "bg-muted-foreground/50",
  },
  requested: {
    label: "Requested",
    className: "bg-primary/8 text-primary border-primary/15",
    dotColor: "bg-primary",
  },
  follow_up_sent: {
    label: "Follow-Up Sent",
    className: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30",
    dotColor: "bg-amber-500",
  },
  received: {
    label: "Received",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30",
    dotColor: "bg-emerald-500",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </span>
  );
}
