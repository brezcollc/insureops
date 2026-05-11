import { cn } from "@/lib/utils";

type StatusType = "pending" | "in-progress" | "completed" | "review" | "requested" | "follow_up_sent" | "received";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string; dotColor: string }> = {
  pending: {
    label: "Pending",
    className: "bg-[#C9A84C] text-[#1A1505] border-[#C9A84C]/40",
    dotColor: "bg-[#1A1505]",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-primary/15 text-primary border-primary/30",
    dotColor: "bg-primary",
  },
  completed: {
    label: "Complete",
    className: "bg-[#16A34A] text-[#04140B] border-[#16A34A]/40",
    dotColor: "bg-[#04140B]",
  },
  review: {
    label: "Under Review",
    className: "bg-secondary text-foreground border-border",
    dotColor: "bg-muted-foreground/50",
  },
  requested: {
    label: "Requested",
    className: "bg-primary/10 text-primary border-primary/30",
    dotColor: "bg-primary",
  },
  follow_up_sent: {
    label: "Follow-Up Sent",
    className: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/40",
    dotColor: "bg-[#C9A84C]",
  },
  received: {
    label: "Received",
    className: "bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/40",
    dotColor: "bg-[#16A34A]",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wider border",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      {config.label}
    </span>
  );
}
