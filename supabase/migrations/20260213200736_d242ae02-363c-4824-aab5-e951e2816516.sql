
-- Fix RLS policies: change from RESTRICTIVE to PERMISSIVE for all SELECT policies
-- The current RESTRICTIVE policies block all access since there are no PERMISSIVE policies

-- clients table
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT WITH CHECK (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE USING (is_authenticated());

DROP POLICY IF EXISTS "Staff can delete clients" ON public.clients;
CREATE POLICY "Staff can delete clients" ON public.clients FOR DELETE USING (is_authenticated());

-- carriers table
DROP POLICY IF EXISTS "Authenticated users can view carriers" ON public.carriers;
CREATE POLICY "Authenticated users can view carriers" ON public.carriers FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert carriers" ON public.carriers;
CREATE POLICY "Authenticated users can insert carriers" ON public.carriers FOR INSERT WITH CHECK (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can update carriers" ON public.carriers;
CREATE POLICY "Authenticated users can update carriers" ON public.carriers FOR UPDATE USING (is_authenticated());

DROP POLICY IF EXISTS "Staff can delete carriers" ON public.carriers;
CREATE POLICY "Staff can delete carriers" ON public.carriers FOR DELETE USING (is_authenticated());

-- loss_run_requests table
DROP POLICY IF EXISTS "Authenticated users can view loss run requests" ON public.loss_run_requests;
CREATE POLICY "Authenticated users can view loss run requests" ON public.loss_run_requests FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert loss run requests" ON public.loss_run_requests;
CREATE POLICY "Authenticated users can insert loss run requests" ON public.loss_run_requests FOR INSERT WITH CHECK (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can update loss run requests" ON public.loss_run_requests;
CREATE POLICY "Authenticated users can update loss run requests" ON public.loss_run_requests FOR UPDATE USING (is_authenticated());

DROP POLICY IF EXISTS "Staff can delete requests" ON public.loss_run_requests;
CREATE POLICY "Staff can delete requests" ON public.loss_run_requests FOR DELETE USING (is_authenticated());

-- policies table
DROP POLICY IF EXISTS "Authenticated users can view policies" ON public.policies;
CREATE POLICY "Authenticated users can view policies" ON public.policies FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert policies" ON public.policies;
CREATE POLICY "Authenticated users can insert policies" ON public.policies FOR INSERT WITH CHECK (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can update policies" ON public.policies;
CREATE POLICY "Authenticated users can update policies" ON public.policies FOR UPDATE USING (is_authenticated());

DROP POLICY IF EXISTS "Staff can delete policies" ON public.policies;
CREATE POLICY "Staff can delete policies" ON public.policies FOR DELETE USING (is_authenticated());

-- email_logs table
DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can view email logs" ON public.email_logs FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (is_authenticated());

-- agent_action_logs table
DROP POLICY IF EXISTS "Authenticated users can view agent action logs" ON public.agent_action_logs;
CREATE POLICY "Authenticated users can view agent action logs" ON public.agent_action_logs FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert agent action logs" ON public.agent_action_logs;
CREATE POLICY "Authenticated users can insert agent action logs" ON public.agent_action_logs FOR INSERT WITH CHECK (is_authenticated());

-- loss_run_documents table
DROP POLICY IF EXISTS "Authenticated users can view loss run documents" ON public.loss_run_documents;
CREATE POLICY "Authenticated users can view loss run documents" ON public.loss_run_documents FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can insert loss run documents" ON public.loss_run_documents;
CREATE POLICY "Authenticated users can insert loss run documents" ON public.loss_run_documents FOR INSERT WITH CHECK (is_authenticated());

DROP POLICY IF EXISTS "Authenticated users can delete loss run documents" ON public.loss_run_documents;
CREATE POLICY "Authenticated users can delete loss run documents" ON public.loss_run_documents FOR DELETE USING (is_authenticated());

-- interest_signups table
DROP POLICY IF EXISTS "Authenticated users can view signups" ON public.interest_signups;
CREATE POLICY "Authenticated users can view signups" ON public.interest_signups FOR SELECT USING (is_authenticated());

DROP POLICY IF EXISTS "Allow public insert to interest signups" ON public.interest_signups;
CREATE POLICY "Allow public insert to interest signups" ON public.interest_signups FOR INSERT WITH CHECK (true);
