
-- 1) agent_action_logs: add org column, backfill, scope policies
ALTER TABLE public.agent_action_logs
  ADD COLUMN IF NOT EXISTS organization_id uuid;

UPDATE public.agent_action_logs a
SET organization_id = r.organization_id
FROM public.loss_run_requests r
WHERE a.request_id = r.id
  AND a.organization_id IS NULL;

DROP POLICY IF EXISTS "Authenticated users can insert agent action logs" ON public.agent_action_logs;
DROP POLICY IF EXISTS "Authenticated users can view agent action logs" ON public.agent_action_logs;

CREATE POLICY "Org members can view agent action logs"
ON public.agent_action_logs
FOR SELECT
USING (
  organization_id IS NOT NULL
  AND public.user_belongs_to_org(organization_id)
);

CREATE POLICY "Org members can insert agent action logs"
ON public.agent_action_logs
FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL
  AND public.user_belongs_to_org(organization_id)
);

-- 2) interest_signups: remove broad authenticated read access
DROP POLICY IF EXISTS "Authenticated users can view signups" ON public.interest_signups;

-- 3) Storage RLS for loss-run-documents: scope by owning organization
DROP POLICY IF EXISTS "Authenticated users can read loss run files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload loss run files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete loss run files" ON storage.objects;

CREATE POLICY "Org members can read their loss run files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'loss-run-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.loss_run_documents d
    WHERE d.file_path = storage.objects.name
      AND d.organization_id IS NOT NULL
      AND public.user_belongs_to_org(d.organization_id)
  )
);

-- For upload, we cannot yet join (row not in loss_run_documents).
-- Restrict to authenticated users; the row insert into loss_run_documents
-- enforces the org membership via its own RLS policy.
CREATE POLICY "Authenticated users can upload loss run files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'loss-run-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Org members can delete their loss run files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'loss-run-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.loss_run_documents d
    WHERE d.file_path = storage.objects.name
      AND d.organization_id IS NOT NULL
      AND public.user_belongs_to_org(d.organization_id)
  )
);
