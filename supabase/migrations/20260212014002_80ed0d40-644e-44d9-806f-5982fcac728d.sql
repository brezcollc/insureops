
-- Make request_id nullable so documents can be uploaded at the policy level
ALTER TABLE public.loss_run_documents ALTER COLUMN request_id DROP NOT NULL;

-- Add new columns for policy-level document management
ALTER TABLE public.loss_run_documents
  ADD COLUMN policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  ADD COLUMN title text,
  ADD COLUMN notes text;

-- Index for querying documents by policy
CREATE INDEX idx_loss_run_documents_policy_id ON public.loss_run_documents(policy_id);
CREATE INDEX idx_loss_run_documents_client_id ON public.loss_run_documents(client_id);
