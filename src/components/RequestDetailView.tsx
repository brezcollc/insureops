import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { Bot, Loader2, Mail, Send } from "lucide-react";
import {
  LossRunRequest,
  useEmailLogs,
  useUpdateLossRunStatus,
  useResendEmail,
  LossRunStatus,
} from "@/hooks/useLossRunRequests";
import { useAgentAction } from "@/hooks/useAgentAction";
import { useToast } from "@/hooks/use-toast";

interface RequestDetailViewProps {
  request: LossRunRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const coverageTypeLabels: Record<string, string> = {
  general_liability: "General Liability",
  workers_compensation: "Workers' Compensation",
  commercial_auto: "Commercial Auto",
  commercial_property: "Commercial Property",
  professional_liability: "Professional Liability",
  umbrella: "Umbrella",
  other: "Other",
};

const statusOptions: { value: LossRunStatus; label: string }[] = [
  { value: "requested", label: "Requested" },
  { value: "follow_up_sent", label: "Follow-Up Sent" },
  { value: "received", label: "Received" },
  { value: "completed", label: "Completed" },
];

export function RequestDetailView({ request, open, onOpenChange }: RequestDetailViewProps) {
  const { toast } = useToast();
  const { data: emailLogs, isLoading: logsLoading } = useEmailLogs(request?.id || null);
  const updateStatus = useUpdateLossRunStatus();
  const resendEmail = useResendEmail();
  const agentAction = useAgentAction();

  const handleRunAgent = async () => {
    if (!request) return;
    await agentAction.mutateAsync(request.id);
  };

  if (!request) return null;

  const handleStatusChange = async (newStatus: LossRunStatus) => {
    console.log("[RequestDetailView] Status change:", request.id, newStatus);
    try {
      await updateStatus.mutateAsync({ id: request.id, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus.replace("_", " ")}`,
      });
    } catch (error) {
      console.error("Status update error:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleResendEmail = async () => {
    console.log("[RequestDetailView] Resend email clicked:", request.id);
    try {
      await resendEmail.mutateAsync(request);
    } catch (error) {
      console.error("Resend email error:", error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Loss Run Request Details
            <StatusBadge status={request.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{request.clients?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carrier</p>
              <p className="font-medium">{request.carriers?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Policy Number</p>
              <p className="font-mono">{request.policy_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Coverage Type</p>
              <p className="font-medium">
                {coverageTypeLabels[request.coverage_type] || request.coverage_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Request Date</p>
              <p className="font-medium">
                {new Date(request.request_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carrier Email</p>
              <p className="font-medium text-sm">
                {request.carriers?.loss_run_email || "N/A"}
              </p>
            </div>
            {request.policy_effective_date && (
              <div>
                <p className="text-sm text-muted-foreground">Policy Effective</p>
                <p className="font-medium">
                  {new Date(request.policy_effective_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {request.policy_expiration_date && (
              <div>
                <p className="text-sm text-muted-foreground">Policy Expiration</p>
                <p className="font-medium">
                  {new Date(request.policy_expiration_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {request.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{request.notes}</p>
            </div>
          )}

          <Separator />

          {/* Status Update */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Update Status</Label>
              <Select
                value={request.status}
                onValueChange={(value) => handleStatusChange(value as LossRunStatus)}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6 flex gap-2">
              <Button
                variant="default"
                onClick={handleRunAgent}
                disabled={agentAction.isPending}
              >
                {agentAction.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                Run Agent
              </Button>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendEmail.isPending}
              >
                {resendEmail.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Resend Email
              </Button>
            </div>
          </div>

          <Separator />

          {/* Email History */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email History
            </h4>
            {logsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : emailLogs && emailLogs.length > 0 ? (
              <div className="space-y-3">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">
                        {log.email_type.replace("_", " ")}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(log.sent_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      To: {log.recipient}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">
                      Subject: {log.subject}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No emails sent yet
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
