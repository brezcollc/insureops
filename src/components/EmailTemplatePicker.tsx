import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, FileText, Edit3 } from "lucide-react";
import { emailTemplates, applyTemplate, formatCoverageType, type TemplateVariables } from "@/lib/emailTemplates";

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
  const [isEditing, setIsEditing] = useState(false);

  const selectedTemplate = useMemo(
    () => emailTemplates.find((t) => t.id === selectedTemplateId) || emailTemplates[0],
    [selectedTemplateId]
  );

  const appliedContent = useMemo(
    () => applyTemplate(selectedTemplate, variables),
    [selectedTemplate, variables]
  );

  const [editedSubject, setEditedSubject] = useState(appliedContent.subject);
  const [editedBody, setEditedBody] = useState(appliedContent.body);

  // Reset edited content when template changes
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      const applied = applyTemplate(template, variables);
      setEditedSubject(applied.subject);
      setEditedBody(applied.body);
    }
    setIsEditing(false);
  };

  // Reset when dialog opens
  useMemo(() => {
    if (open) {
      const templateId = isFollowUp ? "follow_up" : "initial_request";
      setSelectedTemplateId(templateId);
      const template = emailTemplates.find((t) => t.id === templateId);
      if (template) {
        const applied = applyTemplate(template, variables);
        setEditedSubject(applied.subject);
        setEditedBody(applied.body);
      }
      setIsEditing(false);
    }
  }, [open, isFollowUp, variables]);

  const handleSend = async () => {
    const subject = isEditing ? editedSubject : appliedContent.subject;
    const body = isEditing ? editedBody : appliedContent.body;
    await onSend(subject, body, selectedTemplateId);
  };

  const displaySubject = isEditing ? editedSubject : appliedContent.subject;
  const displayBody = isEditing ? editedBody : appliedContent.body;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Select a template and customize before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Template Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="mt-1">
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
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {isEditing ? "Editing" : "Edit"}
            </Button>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-sm font-medium">Subject</Label>
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background"
              />
            ) : (
              <p className="mt-1 text-sm bg-muted p-2 rounded-md">{displaySubject}</p>
            )}
          </div>

          {/* Body */}
          <div>
            <Label className="text-sm font-medium">Message</Label>
            {isEditing ? (
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="mt-1 min-h-[300px] font-mono text-sm"
              />
            ) : (
              <div className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono">
                {displayBody}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
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
