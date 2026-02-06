import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StickyNote, Save, Loader2, Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface InternalNotesProps {
  requestId: string;
  initialNotes: string | null;
  isLocked: boolean;
}

export function InternalNotes({ requestId, initialNotes, isLocked }: InternalNotesProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [originalNotes, setOriginalNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasChanges = notes !== originalNotes;

  useEffect(() => {
    setNotes(initialNotes || "");
    setOriginalNotes(initialNotes || "");
  }, [initialNotes]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || isLocked) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("loss_run_requests")
        .update({ notes })
        .eq("id", requestId);

      if (error) throw error;

      setOriginalNotes(notes);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests"] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_request", requestId] });
      queryClient.invalidateQueries({ queryKey: ["loss_run_requests_by_client"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [notes, requestId, hasChanges, isLocked, queryClient, toast]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          Internal Notes
        </Label>
        {isLocked && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Read-only
          </span>
        )}
      </div>
      
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add internal notes about this request..."
        className={cn(
          "min-h-[80px] resize-none text-sm",
          isLocked && "bg-muted cursor-not-allowed"
        )}
        disabled={isLocked}
      />
      
      {!isLocked && (
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs transition-opacity",
            hasChanges ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground opacity-0"
          )}>
            {hasChanges ? "Unsaved changes" : ""}
          </span>
          <Button
            size="sm"
            variant={justSaved ? "ghost" : "default"}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "h-8 transition-all",
              justSaved && "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : justSaved ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-3 h-3 mr-1" />
                Save Notes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
