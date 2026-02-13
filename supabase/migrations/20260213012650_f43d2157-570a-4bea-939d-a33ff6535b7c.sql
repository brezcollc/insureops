
CREATE POLICY "Allow all inserts on loss_run_documents"
ON public.loss_run_documents
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow all selects on loss_run_documents"
ON public.loss_run_documents
FOR SELECT
TO anon, authenticated
USING (true);
