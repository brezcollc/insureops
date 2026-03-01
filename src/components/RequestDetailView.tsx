import { useState, useEffect } from "react";
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
import { CopyButton } from "@/components/CopyButton";
import { InternalNotes } from "@/components/InternalNotes";
import { EmailTemplatePicker } from "@/components/EmailTemplatePicker";
import { formatCoverageType } from "@/lib/emailTemplates";
import { Bot, Loader2, Mail, Send, ShieldCheck, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  LossRunRequest,
  useEmailLogs,
  useUpdateLossRunStatus,
  useMarkAsReviewed,
  LossRunStatus,
} from "@/hooks/useLossRunRequests";
import { useSendEmailWithTemplate } from "@/hooks/useSendEmailWithTemplate";
import { useAgentAction } from "@/hooks/useAgentAction";
import { useToast } from "@/hooks/use-toast";
import { DocumentUploadSection } from "@/components/DocumentUploadSection";

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
  const sendEmailWithTemplate = useSendEmailWithTemplate();
  const agentAction = useAgentAction();
  const markAsReviewed = useMarkAsReviewed();

  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const [localReviewedAt, setLocalReviewedAt] = useState<string | null>(null);

  // Reset local reviewed state when request changes
  useEffect(() => {
    setLocalReviewedAt(null);
  }, [request?.id]);

  const isReviewed = !!request?.reviewed_at || !!localReviewedAt;

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
    
    try {
      await updateStatus.mutateAsync({ id: request.id, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus.replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleOpenEmailPicker = () => {
    if (isReviewed) {
      toast({
        title: "Request Locked",
        description: "This request has been reviewed and cannot send additional emails.",
        variant: "destructive",
      });
      return;
    }
    setShowEmailPicker(true);
  };

  const handleSendEmail = async (subject: string, body: string, templateId: string) => {
    await sendEmailWithTemplate.mutateAsync({
      request,
      customSubject: subject,
      customBody: body,
      templateId,
    });
    setShowEmailPicker(false);
  };

  const policyPeriod = request.policy_effective_date && request.policy_expiration_date
    ? `${request.policy_effective_date} to ${request.policy_expiration_date}`
    : "Please provide all available loss history";

  const templateVariables = {
    client_name: request.clients?.name || "Unknown Client",
    policy_number: request.policy_number,
    coverage_type: formatCoverageType(request.coverage_type),
    policy_period: policyPeriod,
    sender_name: "Insurance Operations Team",
    agency_name: "Acme Insurance Group",
  };

  const handleMarkAsReviewed = async () => {
    try {
      await markAsReviewed.mutateAsync(request.id);
      setLocalReviewedAt(new Date().toISOString());
      setShowReviewConfirm(false);
    } catch (error) {
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
                <div className="flex items-center gap-1 group">
                  <p className="font-medium">{request.clients?.name || "Unknown"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="font-medium">{request.carriers?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Policy Number</p>
                <div className="flex items-center gap-1 group">
                  <p className="font-mono">{request.policy_number}</p>
                  <CopyButton value={request.policy_number} />
                </div>
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
                <div className="flex items-center gap-1 group">
                  <p className="font-medium text-sm truncate">
                    {request.carriers?.loss_run_email || "N/A"}
                  </p>
                  {request.carriers?.loss_run_email && (
                    <CopyButton value={request.carriers.loss_run_email} />
                  )}
                </div>
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

            {/* Internal Notes Section */}
            <InternalNotes 
              requestId={request.id} 
              initialNotes={request.notes} 
              isLocked={isReviewed} 
            />

            <Separator />

            {/* Documents Section */}
            <DocumentUploadSection requestId={request.id} isReviewed={isReviewed} />

            <Separator />

            {/* Review & Approval Section */}
            <div className={`p-6 rounded-xl border-2 transition-all duration-500 ${
              isReviewed 
                ? 'border-green-500 bg-gradient-to-br from-green-50 via-green-100/80 to-emerald-50 dark:from-green-950/60 dark:via-green-900/40 dark:to-emerald-950/30 shadow-lg shadow-green-500/20 ring-2 ring-green-400/30' 
                : 'border-amber-400/50 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className={`w-5 h-5 ${isReviewed ? 'text-green-600' : 'text-amber-600'}`} />
                  Review & Approval
                </h4>
                {isReviewed && (
                  <Badge className="bg-green-600 hover:bg-green-600 text-white gap-1 px-3 py-1 text-sm font-semibold animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4" />
                    COMPLETE
                  </Badge>
                )}
              </div>
              
              {isReviewed ? (
                <div className="space-y-4">
                  {/* Success State Button - Disabled */}
                  <div className="flex flex-col items-center gap-4 py-6 bg-white/60 dark:bg-green-950/40 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/40 ring-4 ring-green-200 dark:ring-green-800">
                      <CheckCircle2 className="w-9 h-9 text-white" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                        Review Complete
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Reviewed on <span className="font-semibold">{new Date(request.reviewed_at || localReviewedAt!).toLocaleDateString()}</span>
                      </p>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80">
                        by {request.reviewed_by || "Unknown"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 justify-center bg-green-100/50 dark:bg-green-900/30 py-2 px-4 rounded-lg">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Request locked from automated processing</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Pending Review</p>
                      <p className="text-amber-600 dark:text-amber-500 mt-1">
                        Review the loss run documents before marking as complete. This action will lock the request from further updates.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowReviewConfirm(true)}
                    disabled={markAsReviewed.isPending}
                  >
                    {markAsReviewed.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mr-2" />
                    )}
                    Mark as Reviewed
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ All documents require review by a licensed insurance professional before use.
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
                  onClick={handleOpenEmailPicker}
                  disabled={sendEmailWithTemplate.isPending || isReviewed}
                  title={isReviewed ? "Request is reviewed and locked" : undefined}
                >
                  {sendEmailWithTemplate.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Email
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
                You are confirming that you have reviewed the loss run documents for this request.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">This action will:</p>
                <ul className="list-disc list-inside mt-1 text-amber-700 dark:text-amber-300 space-y-1">
                  <li>Lock the request from further changes</li>
                  <li>Prevent status updates</li>
                  <li>Record the review timestamp and reviewer</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. Ensure all documents have been reviewed by a licensed professional.
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

      {/* Email Template Picker */}
      <EmailTemplatePicker
        open={showEmailPicker}
        onOpenChange={setShowEmailPicker}
        variables={templateVariables}
        onSend={handleSendEmail}
        isSending={sendEmailWithTemplate.isPending}
        isFollowUp={request.status === "follow_up_sent"}
      />
    </>
  );
}