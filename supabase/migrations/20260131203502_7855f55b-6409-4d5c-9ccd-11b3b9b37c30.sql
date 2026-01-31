-- Create enum for request status
CREATE TYPE public.loss_run_status AS ENUM ('requested', 'follow_up_sent', 'received', 'completed');

-- Create enum for coverage types
CREATE TYPE public.coverage_type AS ENUM (
  'general_liability',
  'workers_compensation',
  'commercial_auto',
  'commercial_property',
  'professional_liability',
  'umbrella',
  'other'
);

-- Create enum for email types
CREATE TYPE public.email_type AS ENUM ('initial_request', 'follow_up', 'reminder');

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create carriers table
CREATE TABLE public.carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  loss_run_email TEXT NOT NULL,
  underwriter_email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create loss_run_requests table
CREATE TABLE public.loss_run_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  coverage_type public.coverage_type NOT NULL,
  status public.loss_run_status NOT NULL DEFAULT 'requested',
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  policy_effective_date DATE,
  policy_expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create email_logs table
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.loss_run_requests(id) ON DELETE CASCADE,
  email_type public.email_type NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_run_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- RLS policies for clients
CREATE POLICY "Staff can view all clients"
  ON public.clients FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Staff can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.is_authenticated());

CREATE POLICY "Staff can update clients"
  ON public.clients FOR UPDATE
  USING (public.is_authenticated());

CREATE POLICY "Staff can delete clients"
  ON public.clients FOR DELETE
  USING (public.is_authenticated());

-- RLS policies for carriers
CREATE POLICY "Staff can view all carriers"
  ON public.carriers FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Staff can create carriers"
  ON public.carriers FOR INSERT
  WITH CHECK (public.is_authenticated());

CREATE POLICY "Staff can update carriers"
  ON public.carriers FOR UPDATE
  USING (public.is_authenticated());

CREATE POLICY "Staff can delete carriers"
  ON public.carriers FOR DELETE
  USING (public.is_authenticated());

-- RLS policies for loss_run_requests
CREATE POLICY "Staff can view all requests"
  ON public.loss_run_requests FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Staff can create requests"
  ON public.loss_run_requests FOR INSERT
  WITH CHECK (public.is_authenticated());

CREATE POLICY "Staff can update requests"
  ON public.loss_run_requests FOR UPDATE
  USING (public.is_authenticated());

CREATE POLICY "Staff can delete requests"
  ON public.loss_run_requests FOR DELETE
  USING (public.is_authenticated());

-- RLS policies for email_logs
CREATE POLICY "Staff can view all email logs"
  ON public.email_logs FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Staff can create email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (public.is_authenticated());

-- Create indexes for better query performance
CREATE INDEX idx_loss_run_requests_client_id ON public.loss_run_requests(client_id);
CREATE INDEX idx_loss_run_requests_carrier_id ON public.loss_run_requests(carrier_id);
CREATE INDEX idx_loss_run_requests_status ON public.loss_run_requests(status);
CREATE INDEX idx_loss_run_requests_request_date ON public.loss_run_requests(request_date);
CREATE INDEX idx_email_logs_request_id ON public.email_logs(request_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loss_run_requests_updated_at
  BEFORE UPDATE ON public.loss_run_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample carriers
INSERT INTO public.carriers (name, loss_run_email, underwriter_email) VALUES
  ('Liberty Mutual', 'lossruns@libertymutual.com', 'underwriting@libertymutual.com'),
  ('Travelers', 'lossruns@travelers.com', 'underwriting@travelers.com'),
  ('Hartford', 'lossruns@thehartford.com', 'underwriting@thehartford.com'),
  ('CNA', 'lossruns@cna.com', 'underwriting@cna.com'),
  ('Zurich', 'lossruns@zurichna.com', 'underwriting@zurichna.com'),
  ('AIG', 'lossruns@aig.com', 'underwriting@aig.com'),
  ('Chubb', 'lossruns@chubb.com', 'underwriting@chubb.com');

-- Insert some sample clients
INSERT INTO public.clients (name, contact_email) VALUES
  ('Acme Corporation', 'contact@acmecorp.com'),
  ('TechStart Inc.', 'info@techstart.com'),
  ('BuildRight Construction', 'office@buildright.com'),
  ('Fresh Foods LLC', 'admin@freshfoods.com'),
  ('Metro Logistics', 'operations@metrologistics.com');