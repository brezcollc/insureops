-- Add optional client_code field to clients table
ALTER TABLE public.clients 
ADD COLUMN client_code text;