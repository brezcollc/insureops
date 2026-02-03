-- Add new fields to clients table for the client-first architecture
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
ADD COLUMN IF NOT EXISTS internal_notes text,
ADD COLUMN IF NOT EXISTS renewal_date date;

-- Create policies table to track individual policies per client
CREATE TABLE public.policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES public.carriers(id),
  policy_number text NOT NULL,
  coverage_type public.coverage_type NOT NULL,
  effective_date date,
  expiration_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS on policies
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Public read access to policies
CREATE POLICY "Allow public read access to policies"
ON public.policies
FOR SELECT
USING (true);

-- Public insert access to policies
CREATE POLICY "Allow public insert to policies"
ON public.policies
FOR INSERT
WITH CHECK (true);

-- Public update access to policies
CREATE POLICY "Allow public update to policies"
ON public.policies
FOR UPDATE
USING (true);

-- Staff can delete policies
CREATE POLICY "Staff can delete policies"
ON public.policies
FOR DELETE
USING (is_authenticated());

-- Create trigger for updated_at on policies
CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster client lookups
CREATE INDEX idx_policies_client_id ON public.policies(client_id);
CREATE INDEX idx_policies_carrier_id ON public.policies(carrier_id);