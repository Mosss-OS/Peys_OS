-- NDPR/NDPA 2023 Compliance: Consent and Audit Logging
-- Adds consent tracking and audit logging tables

-- Add consent columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_source VARCHAR(50), -- 'web', 'whatsapp', 'api'
ADD COLUMN IF NOT EXISTS data_rights_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_rights_request_type VARCHAR(50), -- 'access', 'deletion', 'correction'
ADD COLUMN IF NOT EXISTS data_rights_request_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'processing', 'completed'

-- Add consent columns to whatsapp_sessions table for WhatsApp consent tracking
ALTER TABLE whatsapp_sessions
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;

-- Create audit_logs table for data access tracking (NDPR Article 28)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'read', 'create', 'update', 'delete', 'export'
    resource_type VARCHAR(50) NOT NULL, -- 'profile', 'transaction', 'wallet', etc.
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_id UUID DEFAULT gen_random_uuid(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Create function to log data access
CREATE OR REPLACE FUNCTION log_data_access(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id VARCHAR,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_ip_address,
        p_user_agent,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record consent
CREATE OR REPLACE FUNCTION record_consent(
    p_user_id UUID,
    p_source VARCHAR,
    p_consent_given BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET 
        consent_given = p_consent_given,
        consent_timestamp = CASE WHEN p_consent_given THEN NOW() ELSE consent_timestamp END,
        consent_source = p_source,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle data rights request
CREATE OR REPLACE FUNCTION create_data_rights_request(
    p_user_id UUID,
    p_request_type VARCHAR,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- Update profile with request info
    UPDATE profiles
    SET 
        data_rights_requested_at = NOW(),
        data_rights_request_type = p_request_type,
        data_rights_request_status = 'pending',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log the request in audit log
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        p_user_id,
        'data_rights_request',
        'profile',
        p_user_id::TEXT,
        jsonb_build_object(
            'request_type', p_request_type,
            'details', p_details,
            'requested_at', NOW()
        )
    );
    
    RETURN p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for audit_logs (only admins can read, system can insert)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can manage audit logs"
ON audit_logs
FOR ALL
TO service_role
USING (true);

-- Allow authenticated users to view their own audit entries
CREATE POLICY "Users can view their own audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS for profiles consent columns
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own consent
CREATE POLICY "Users can update own consent"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role can manage profiles"
ON profiles
FOR ALL
TO service_role
USING (true);

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'NDPR Article 28 compliance: Records all access to personal data';
COMMENT ON COLUMN profiles.consent_given IS 'NDPR compliance: Whether user has given consent for data processing';
COMMENT ON COLUMN profiles.consent_timestamp IS 'NDPR compliance: Timestamp when consent was given';
COMMENT ON COLUMN profiles.consent_source IS 'Source of consent: web, whatsapp, api';
COMMENT ON COLUMN profiles.data_rights_requested_at IS 'NDPA 2023: When user requested data rights';
COMMENT ON COLUMN profiles.data_rights_request_type IS 'NDPA 2023: Type of rights requested';
