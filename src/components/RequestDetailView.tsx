import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Bot, Loader2, Mail, Send, ShieldCheck, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  LossRunRequest,
  useEmailLogs,
  useUpdateLossRunStatus,
  useResendEmail,
  useMarkAsReviewed,
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
  const markAsReviewed = useMarkAsReviewed();

  const [showReviewConfirm, setShowReviewConfirm] = useState(false);

  const isReviewed = !!request?.reviewed_at;

  const handleRunAgent = async () => {
    if (!request) return;
    
    if (isReviewed) {
      toast({
        title: "Request Locked",
        description: "This request has been reviewed and locked from further agent actions.",
        variant: "destructive",
      });
      return;
    }
    
    await agentAction.mutateAsync(request.id);
  };

  if (!request) return null;

  const handleStatusChange = async (newStatus: LossRunStatus) => {
    if (isReviewed) {
      toast({
        title: "Request Locked",
        description: "This request has been reviewed and cannot be modified.",
        variant: "destructive",
      });
      return;
    }
    
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
    if (isReviewed) {
      toast({
        title: "Request Locked",
        description: "This request has been reviewed and cannot send additional emails.",
        variant: "destructive",
      });
      return;
    }
    
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

  const handleMarkAsReviewed = async () => {
    try {
      await markAsReviewed.mutateAsync(request.id);
      setShowReviewConfirm(false);
    } catch (error) {
      console.error("Mark as reviewed error:", error);
      toast({
        title: "Error",
        description: "Failed to mark request as reviewed",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Loss Run Request Details
              <StatusBadge status={request.status} />
              {isReviewed && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
                  <Lock className="w-3 h-3" />
                  Reviewed
                </Badge>
              )}
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
                <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}

            <Separator />

            {/* Review & Approval Section */}
            <div className={`p-4 rounded-lg border-2 ${isReviewed ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' : 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'}`}>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${isReviewed ? 'text-green-600' : 'text-amber-600'}`} />
                Review & Approval
              </h4>
              
              {isReviewed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">This request has been reviewed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reviewed At</p>
                      <p className="font-medium">
                        {new Date(request.reviewed_at!).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reviewed By</p>
                      <p className="font-medium">{request.reviewed_by || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Lock className="w-4 h-4" />
                    <span>Further agent actions and status changes are locked.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Pending Review</p>
                      <p className="text-muted-foreground mt-1">
                        Review this loss run data before marking as complete. This action will lock the request from further automated processing.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setShowReviewConfirm(true)}
                    disabled={markAsReviewed.isPending}
                  >
                    {markAsReviewed.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    I have reviewed this loss run data
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ All outputs require review by a licensed insurance professional before use.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Status Update */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Update Status</Label>
                <Select
                  value={request.status}
                  onValueChange={(value) => handleStatusChange(value as LossRunStatus)}
                  disabled={updateStatus.isPending || isReviewed}
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
                  disabled={agentAction.isPending || isReviewed}
                  title={isReviewed ? "Request is reviewed and locked" : undefined}
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
                  disabled={resendEmail.isPending || isReviewed}
                  title={isReviewed ? "Request is reviewed and locked" : undefined}
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

      {/* Review Confirmation Dialog */}
      <AlertDialog open={showReviewConfirm} onOpenChange={setShowReviewConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Mark as Reviewed?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are confirming that you have reviewed the loss run data for this request.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">This action will:</p>
                <ul className="list-disc list-inside mt-1 text-amber-700 dark:text-amber-300 space-y-1">
                  <li>Lock the request from further agent actions</li>
                  <li>Prevent automated status changes</li>
                  <li>Record the review timestamp and reviewer</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. Ensure all data has been verified by a licensed professional.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsReviewed}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}