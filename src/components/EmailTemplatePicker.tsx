import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, Mail, AlertCircle } from "lucide-react";
import { emailTemplates, applyTemplate, type TemplateVariables } from "@/lib/emailTemplates";

interface EmailTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: TemplateVariables;
  onSend: (subject: string, body: string, templateId: string) => Promise<void>;
  isSending: boolean;
  isFollowUp?: boolean;
}

export function EmailTemplatePicker({
  open,
  onOpenChange,
  variables,
  onSend,
  isSending,
  isFollowUp = false,
}: EmailTemplatePickerProps) {
  const defaultTemplateId = isFollowUp ? "follow_up" : "initial_request";
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Initialize/reset content when dialog opens
  useEffect(() => {
    if (open) {
      const templateId = isFollowUp ? "follow_up" : "initial_request";
      setSelectedTemplateId(templateId);
      const template = emailTemplates.find((t) => t.id === templateId);
      if (template) {
        const applied = applyTemplate(template, variables);
        setSubject(applied.subject);
        setBody(applied.body);
      }
      setHasUserEdited(false);
    }
  }, [open, isFollowUp, variables]);

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    // If user has edited, confirm before replacing
    if (hasUserEdited) {
      const confirmed = window.confirm(
        "Switching templates will replace your current edits. Continue?"
      );
      if (!confirmed) return;
    }

    setSelectedTemplateId(templateId);
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      const applied = applyTemplate(template, variables);
      setSubject(applied.subject);
      setBody(applied.body);
    }
    setHasUserEdited(false);
  };

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    setHasUserEdited(true);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    setHasUserEdited(true);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    await onSend(subject, body, selectedTemplateId);
  };

  const isValid = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Select a template, review the content, and customize before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Template Selector */}
          <div>
            <Label htmlFor="template-select" className="text-sm font-medium">
              Email Template
            </Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template-select" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Selecting a template will populate the subject and message below.
            </p>
          </div>

          {/* Subject - Always Editable */}
          <div>
            <Label htmlFor="email-subject" className="text-sm font-medium">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="Enter email subject..."
              className="mt-1.5"
            />
            {!subject.trim() && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Subject is required
              </p>
            )}
          </div>

          {/* Body - Always Editable */}
          <div>
            <Label htmlFor="email-body" className="text-sm font-medium">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Enter email message..."
              className="mt-1.5 min-h-[280px] font-mono text-sm"
            />
            {!body.trim() && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Message is required
              </p>
            )}
          </div>

          {/* Info about editing */}
          {hasUserEdited && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              You have made custom edits to this email.
            </p>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !isValid}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
