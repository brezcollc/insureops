-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Staff can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can view all carriers" ON public.carriers;
DROP POLICY IF EXISTS "Staff can view all requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Staff can view all email logs" ON public.email_logs;

-- Create permissive SELECT policies for testing (allows public read)
CREATE POLICY "Allow public read access to clients"
ON public.clients FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to carriers"
ON public.carriers FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to loss run requests"
ON public.loss_run_requests FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to email logs"
ON public.email_logs FOR SELECT
USING (true);

-- Also allow public INSERT for testing (so forms work without auth)
DROP POLICY IF EXISTS "Staff can create clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can create carriers" ON public.carriers;
DROP POLICY IF EXISTS "Staff can create requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Staff can create email logs" ON public.email_logs;

CREATE POLICY "Allow public insert to clients"
ON public.clients FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to carriers"
ON public.carriers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to loss run requests"
ON public.loss_run_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert to email logs"
ON public.email_logs FOR INSERT
WITH CHECK (true);

-- Allow public UPDATE for testing
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update carriers" ON public.carriers;
DROP POLICY IF EXISTS "Staff can update requests" ON public.loss_run_requests;

CREATE POLICY "Allow public update to clients"
ON public.clients FOR UPDATE
USING (true);

CREATE POLICY "Allow public update to carriers"
ON public.carriers FOR UPDATE
USING (true);

CREATE POLICY "Allow public update to loss run requests"
ON public.loss_run_requests FOR UPDATE
USING (true);