
-- Add carrier_email to policies table (required for new policies)
ALTER TABLE public.policies ADD COLUMN carrier_email text;

-- Backfill existing policies with their carrier's loss_run_email
UPDATE public.policies p
SET carrier_email = c.loss_run_email
FROM public.carriers c
WHERE p.carrier_id = c.id;

-- Now make it NOT NULL
ALTER TABLE public.policies ALTER COLUMN carrier_email SET NOT NULL;

-- Add sent_to_email to loss_run_requests to track which email was used
ALTER TABLE public.loss_run_requests ADD COLUMN sent_to_email text;
