import { cn } from "@/lib/utils";

type StatusType = "pending" | "in-progress" | "completed" | "review";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-status-pending-bg text-status-pending",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-status-in-progress-bg text-status-in-progress",
  },
  completed: {
    label: "Completed",
    className: "bg-status-completed-bg text-status-completed",
  },
  review: {
    label: "Under Review",
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
