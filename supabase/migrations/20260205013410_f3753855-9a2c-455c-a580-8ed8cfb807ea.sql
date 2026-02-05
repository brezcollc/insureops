-- Create storage bucket for loss run documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('loss-run-documents', 'loss-run-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create table to track uploaded documents
CREATE TABLE public.loss_run_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.loss_run_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT DEFAULT 'Manual Upload',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loss_run_documents ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to loss run documents"
ON public.loss_run_documents
FOR SELECT
USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert to loss run documents"
ON public.loss_run_documents
FOR INSERT
WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete to loss run documents"
ON public.loss_run_documents
FOR DELETE
USING (true);

-- Storage policies for the bucket
CREATE POLICY "Allow public read access to loss run files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'loss-run-documents');

CREATE POLICY "Allow public upload to loss run files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'loss-run-documents');

CREATE POLICY "Allow public delete loss run files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'loss-run-documents');

-- Create index for efficient lookups
CREATE INDEX idx_loss_run_documents_request ON public.loss_run_documents(request_id, created_at DESC);