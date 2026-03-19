-- Create table to store AI-generated loss run analyses
CREATE TABLE IF NOT EXISTS public.loss_run_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.loss_run_documents(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES public.loss_run_requests(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) NOT NULL,

  -- Analysis status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,

  -- Extracted data
  policy_period text,
  carrier_name text,
  total_claims integer,
  open_claims integer,
  closed_claims integer,
  total_incurred numeric,
  total_paid numeric,
  total_reserved numeric,
  largest_claim_amount numeric,
  largest_claim_description text,
  largest_claim_date text,
  trend text CHECK (trend IN ('increasing', 'decreasing', 'stable', 'insufficient_data')),

  -- Year-by-year breakdown stored as JSON array
  yearly_breakdown jsonb,

  -- Risk observations as JSON array of strings
  risk_observations jsonb,

  -- Full narrative summary from Claude
  summary text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  analyzed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.loss_run_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see analyses for their organization
CREATE POLICY "Users can view their organization's analyses"
  ON public.loss_run_analyses
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert analyses for their organization"
  ON public.loss_run_analyses
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all analyses"
  ON public.loss_run_analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups by document and request
CREATE INDEX IF NOT EXISTS loss_run_analyses_document_id_idx ON public.loss_run_analyses(document_id);
CREATE INDEX IF NOT EXISTS loss_run_analyses_request_id_idx ON public.loss_run_analyses(request_id);
CREATE INDEX IF NOT EXISTS loss_run_analyses_org_id_idx ON public.loss_run_analyses(organization_id);
