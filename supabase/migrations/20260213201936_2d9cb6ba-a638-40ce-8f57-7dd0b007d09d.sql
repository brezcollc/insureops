
-- 1. Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create organization_members table
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Helper: get current user's organization_id (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- 4. Helper: check if user belongs to an organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = _org_id
  )
$$;

-- 5. Add organization_id to core tables (nullable to preserve existing data)
ALTER TABLE public.clients ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.policies ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.loss_run_requests ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.loss_run_documents ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.carriers ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.email_logs ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- 6. Create indexes for performance
CREATE INDEX idx_clients_org ON public.clients(organization_id);
CREATE INDEX idx_policies_org ON public.policies(organization_id);
CREATE INDEX idx_loss_run_requests_org ON public.loss_run_requests(organization_id);
CREATE INDEX idx_loss_run_documents_org ON public.loss_run_documents(organization_id);
CREATE INDEX idx_carriers_org ON public.carriers(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- 7. RLS policies for organizations
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT
  USING (public.user_belongs_to_org(id));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (is_authenticated());

CREATE POLICY "Members can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.user_belongs_to_org(id));

-- 8. RLS policies for organization_members
CREATE POLICY "Members can view their org members"
  ON public.organization_members FOR SELECT
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Members can invite to their org"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.user_belongs_to_org(organization_id) OR (user_id = auth.uid()));

CREATE POLICY "Members can remove from their org"
  ON public.organization_members FOR DELETE
  USING (public.user_belongs_to_org(organization_id));

-- 9. Update RLS on core tables to scope by organization
-- Drop old policies and create org-scoped ones for clients
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can delete clients" ON public.clients;

CREATE POLICY "Org members can view clients"
  ON public.clients FOR SELECT
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can update clients"
  ON public.clients FOR UPDATE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can delete clients"
  ON public.clients FOR DELETE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

-- Policies table
DROP POLICY IF EXISTS "Authenticated users can view policies" ON public.policies;
DROP POLICY IF EXISTS "Authenticated users can insert policies" ON public.policies;
DROP POLICY IF EXISTS "Authenticated users can update policies" ON public.policies;
DROP POLICY IF EXISTS "Staff can delete policies" ON public.policies;

CREATE POLICY "Org members can view policies"
  ON public.policies FOR SELECT
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert policies"
  ON public.policies FOR INSERT
  WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can update policies"
  ON public.policies FOR UPDATE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can delete policies"
  ON public.policies FOR DELETE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

-- Loss run requests
DROP POLICY IF EXISTS "Authenticated users can view loss run requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Authenticated users can insert loss run requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Authenticated users can update loss run requests" ON public.loss_run_requests;
DROP POLICY IF EXISTS "Staff can delete requests" ON public.loss_run_requests;

CREATE POLICY "Org members can view loss run requests"
  ON public.loss_run_requests FOR SELECT
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert loss run requests"
  ON public.loss_run_requests FOR INSERT
  WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can update loss run requests"
  ON public.loss_run_requests FOR UPDATE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can delete loss run requests"
  ON public.loss_run_requests FOR DELETE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

-- Loss run documents
DROP POLICY IF EXISTS "Allow all inserts on loss_run_documents" ON public.loss_run_documents;
DROP POLICY IF EXISTS "Allow all selects on loss_run_documents" ON public.loss_run_documents;
DROP POLICY IF EXISTS "Authenticated users can view loss run documents" ON public.loss_run_documents;
DROP POLICY IF EXISTS "Authenticated users can insert loss run documents" ON public.loss_run_documents;
DROP POLICY IF EXISTS "Authenticated users can delete loss run documents" ON public.loss_run_documents;

CREATE POLICY "Org members can view loss run documents"
  ON public.loss_run_documents FOR SELECT
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert loss run documents"
  ON public.loss_run_documents FOR INSERT
  WITH CHECK (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can delete loss run documents"
  ON public.loss_run_documents FOR DELETE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

-- Carriers
DROP POLICY IF EXISTS "Authenticated users can view carriers" ON public.carriers;
DROP POLICY IF EXISTS "Authenticated users can insert carriers" ON public.carriers;
DROP POLICY IF EXISTS "Authenticated users can update carriers" ON public.carriers;
DROP POLICY IF EXISTS "Staff can delete carriers" ON public.carriers;

CREATE POLICY "Org members can view carriers"
  ON public.carriers FOR SELECT
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert carriers"
  ON public.carriers FOR INSERT
  WITH CHECK (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can update carriers"
  ON public.carriers FOR UPDATE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can delete carriers"
  ON public.carriers FOR DELETE
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

-- Email logs
DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.email_logs;

CREATE POLICY "Org members can view email logs"
  ON public.email_logs FOR SELECT
  USING (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (organization_id IS NULL AND is_authenticated() OR public.user_belongs_to_org(organization_id));

-- 10. Trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Auto-create org + membership on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create a default organization for the new user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', split_part(NEW.email, '@', 1) || '''s Organization'))
  RETURNING id INTO new_org_id;
  
  -- Add user as owner of the organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_org();
