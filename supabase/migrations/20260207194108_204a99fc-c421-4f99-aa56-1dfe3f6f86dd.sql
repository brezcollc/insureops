-- ================================================
-- SECURITY FIX: Replace all public RLS policies with authenticated-only access
-- ================================================

-- =====================
-- CLIENTS TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert to clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update to clients" ON public.clients;

CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert clients"
ON public.clients FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can update clients"
ON public.clients FOR UPDATE
USING (is_authenticated());

-- =====================
-- CARRIERS TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to carriers" ON public.carriers;
DROP POLICY IF EXISTS "Allow public insert to carriers" ON public.carriers;
DROP POLICY IF EXISTS "Allow public update to carriers" ON public.carriers;

CREATE POLICY "Authenticated users can view carriers"
ON public.carriers FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert carriers"
ON public.carriers FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can update carriers"
ON public.carriers FOR UPDATE
USING (is_authenticated());

-- =====================
-- LOSS_RUN_REQUESTS TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to loss run requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Allow public insert to loss run requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Allow public update to loss run requests" ON public.loss_run_requests;

CREATE POLICY "Authenticated users can view loss run requests"
ON public.loss_run_requests FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert loss run requests"
ON public.loss_run_requests FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can update loss run requests"
ON public.loss_run_requests FOR UPDATE
USING (is_authenticated());

-- =====================
-- EMAIL_LOGS TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Allow public insert to email logs" ON public.email_logs;

CREATE POLICY "Authenticated users can view email logs"
ON public.email_logs FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert email logs"
ON public.email_logs FOR INSERT
WITH CHECK (is_authenticated());

-- =====================
-- POLICIES TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to policies" ON public.policies;
DROP POLICY IF EXISTS "Allow public insert to policies" ON public.policies;
DROP POLICY IF EXISTS "Allow public update to policies" ON public.policies;

CREATE POLICY "Authenticated users can view policies"
ON public.policies FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert policies"
ON public.policies FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can update policies"
ON public.policies FOR UPDATE
USING (is_authenticated());

-- =====================
-- AGENT_ACTION_LOGS TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to agent action logs" ON public.agent_action_logs;
DROP POLICY IF EXISTS "Allow public insert to agent action logs" ON public.agent_action_logs;

CREATE POLICY "Authenticated users can view agent action logs"
ON public.agent_action_logs FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert agent action logs"
ON public.agent_action_logs FOR INSERT
WITH CHECK (is_authenticated());

-- =====================
-- LOSS_RUN_DOCUMENTS TABLE
-- =====================
DROP POLICY IF EXISTS "Allow public read access to loss run documents" ON public.loss_run_documents;
DROP POLICY IF EXISTS "Allow public insert to loss run documents" ON public.loss_run_documents;
DROP POLICY IF EXISTS "Allow public delete to loss run documents" ON public.loss_run_documents;

CREATE POLICY "Authenticated users can view loss run documents"
ON public.loss_run_documents FOR SELECT
USING (is_authenticated());

CREATE POLICY "Authenticated users can insert loss run documents"
ON public.loss_run_documents FOR INSERT
WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can delete loss run documents"
ON public.loss_run_documents FOR DELETE
USING (is_authenticated());

-- =====================
-- INTEREST_SIGNUPS TABLE (keep public insert for landing page)
-- =====================
-- This table intentionally allows public INSERT for the landing page signup form
-- Only authenticated users can view the signups (already correct)

-- =====================
-- STORAGE: loss-run-documents bucket
-- =====================
DROP POLICY IF EXISTS "Allow public read access to loss run files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to loss run files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete loss run files" ON storage.objects;

CREATE POLICY "Authenticated users can read loss run files"
ON storage.objects FOR SELECT
USING (bucket_id = 'loss-run-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload loss run files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'loss-run-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete loss run files"
ON storage.objects FOR DELETE
USING (bucket_id = 'loss-run-documents' AND auth.uid() IS NOT NULL);