-- Add reviewed_at and reviewed_by columns to loss_run_requests table
ALTER TABLE public.loss_run_requests
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN reviewed_by TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.loss_run_requests.reviewed_at IS 'Timestamp when the request was marked as reviewed by a licensed professional';
COMMENT ON COLUMN public.loss_run_requests.reviewed_by IS 'Identifier of who performed the review (placeholder until auth is implemented)';