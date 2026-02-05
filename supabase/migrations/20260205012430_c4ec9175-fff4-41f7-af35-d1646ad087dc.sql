-- Create agent action log table for auditability
CREATE TABLE public.agent_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.loss_run_requests(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'document_upload', 'follow_up', 'batch')),
  action_taken TEXT NOT NULL,
  action_result TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to agent action logs"
ON public.agent_action_logs
FOR SELECT
USING (true);

-- Allow public insert (edge functions need this)
CREATE POLICY "Allow public insert to agent action logs"
ON public.agent_action_logs
FOR INSERT
WITH CHECK (true);

-- Create index for efficient duplicate checking
CREATE INDEX idx_agent_action_logs_request_action ON public.agent_action_logs(request_id, action_taken, created_at DESC);
CREATE INDEX idx_agent_action_logs_trigger_type ON public.agent_action_logs(trigger_type, created_at DESC);