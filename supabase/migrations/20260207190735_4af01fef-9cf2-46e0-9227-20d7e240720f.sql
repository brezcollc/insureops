-- Create table for interest signups (no auth required)
CREATE TABLE public.interest_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.interest_signups ENABLE ROW LEVEL SECURITY;

-- Allow public insert (no auth required for signups)
CREATE POLICY "Allow public insert to interest signups"
ON public.interest_signups
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view signups (for admin purposes)
CREATE POLICY "Authenticated users can view signups"
ON public.interest_signups
FOR SELECT
USING (is_authenticated());

-- Create unique index on email to prevent duplicates
CREATE UNIQUE INDEX idx_interest_signups_email ON public.interest_signups(email);