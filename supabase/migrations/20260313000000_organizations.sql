-- Organizations & Team Management
-- Issue #4: Organizations - Team Management, Roles, and Business Features
-- Date: 2026-03-12

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_email ON public.organization_members(email);

-- ============================================
-- PAYMENT APPROVALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('single', 'bulk', 'scheduled', 'contractor')),
  amount BIGINT NOT NULL,
  amount_usd FLOAT,
  token TEXT NOT NULL DEFAULT 'USDC',
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  rejected_by UUID REFERENCES auth.users(id),
  approvers JSONB DEFAULT '[]',
  required_approvals INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_approvals_org ON public.payment_approvals(organization_id);
CREATE INDEX idx_payment_approvals_status ON public.payment_approvals(status);

-- ============================================
-- MERCHANT STORES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.merchant_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  checkout_settings JSONB DEFAULT '{"allowed_methods": ["card", "crypto"], "collect_email": true}',
  notification_settings JSONB DEFAULT '{"email_notifications": true}',
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.merchant_stores ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_merchant_stores_org ON public.merchant_stores(organization_id);

-- ============================================
-- PAYMENT LINKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.merchant_stores(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount BIGINT,
  amount_type TEXT DEFAULT 'fixed' CHECK (amount_type IN ('fixed', 'custom', 'range')),
  min_amount BIGINT,
  max_amount BIGINT,
  token TEXT NOT NULL DEFAULT 'USDC',
  currency TEXT DEFAULT 'USD',
  slug TEXT UNIQUE NOT NULL,
  redirect_url TEXT,
  customer_fields JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'exhausted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_links_org ON public.payment_links(organization_id);

-- ============================================
-- CONTRACTORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  wallet_address TEXT,
  phone TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  rate_amount BIGINT,
  rate_type TEXT DEFAULT 'hourly' CHECK (rate_type IN ('hourly', 'daily', 'project', 'monthly')),
  payment_method TEXT DEFAULT 'crypto' CHECK (payment_method IN ('crypto', 'bank', 'paypal', 'wise')),
  bank_details JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contractors_org ON public.contractors(organization_id);

-- ============================================
-- PAYMENT TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  token TEXT NOT NULL DEFAULT 'USDC',
  amount BIGINT,
  recipient_address TEXT,
  recipient_email TEXT,
  schedule JSONB,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_templates_org ON public.payment_templates(organization_id);

-- ============================================
-- APPROVAL THRESHOLDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.approval_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_amount BIGINT NOT NULL,
  max_amount BIGINT,
  required_approvals INTEGER DEFAULT 1,
  approver_roles JSONB DEFAULT '["admin", "manager"]',
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.approval_thresholds ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_approval_thresholds_org ON public.approval_thresholds(organization_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_organizations_updated_at();

CREATE OR REPLACE FUNCTION public.update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_organization_members_updated_at();

CREATE OR REPLACE FUNCTION public.update_payment_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_approvals_updated_at ON public.payment_approvals;
CREATE TRIGGER update_payment_approvals_updated_at
  BEFORE UPDATE ON public.payment_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_approvals_updated_at();

CREATE OR REPLACE FUNCTION public.update_merchant_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_merchant_stores_updated_at ON public.merchant_stores;
CREATE TRIGGER update_merchant_stores_updated_at
  BEFORE UPDATE ON public.merchant_stores
  FOR EACH ROW EXECUTE FUNCTION public.update_merchant_stores_updated_at();

CREATE OR REPLACE FUNCTION public.update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_links_updated_at ON public.payment_links;
CREATE TRIGGER update_payment_links_updated_at
  BEFORE UPDATE ON public.payment_links
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_links_updated_at();

CREATE OR REPLACE FUNCTION public.update_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contractors_updated_at ON public.contractors;
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_contractors_updated_at();

CREATE OR REPLACE FUNCTION public.update_payment_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_templates_updated_at ON public.payment_templates;
CREATE TRIGGER update_payment_templates_updated_at
  BEFORE UPDATE ON public.payment_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_templates_updated_at();

CREATE OR REPLACE FUNCTION public.update_approval_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_approval_thresholds_updated_at ON public.approval_thresholds;
CREATE TRIGGER update_approval_thresholds_updated_at
  BEFORE UPDATE ON public.approval_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_approval_thresholds_updated_at();

-- ============================================
-- ORGANIZATION POLICIES (after all tables created)
-- ============================================

CREATE POLICY "Organization owners can manage their organizations"
  ON public.organizations FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Organization members can view their organization"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can view members"
  ON public.organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage members"
  ON public.organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization members can view approvals"
  ON public.payment_approvals FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization managers can create approvals"
  ON public.payment_approvals FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Organization members can view stores"
  ON public.merchant_stores FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage stores"
  ON public.merchant_stores FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization members can view payment links"
  ON public.payment_links FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active payment links"
  ON public.payment_links FOR SELECT
  USING (status = 'active');

CREATE POLICY "Organization admins can manage payment links"
  ON public.payment_links FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Organization members can view contractors"
  ON public.contractors FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage contractors"
  ON public.contractors FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Organization members can view templates"
  ON public.payment_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization managers can manage templates"
  ON public.payment_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Organization members can view thresholds"
  ON public.approval_thresholds FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage thresholds"
  ON public.approval_thresholds FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
