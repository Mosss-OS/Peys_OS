-- Flutterwave Fiat Withdrawal Integration
-- Tables for bank accounts, fiat withdrawals, and P2P marketplace

-- Bank accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiat withdrawals table
CREATE TABLE IF NOT EXISTS fiat_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_fiat DECIMAL(18, 2) NOT NULL,
    amount_usdc DECIMAL(18, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(18, 8),
    fee DECIMAL(18, 2) DEFAULT 0,
    bank_account_id UUID REFERENCES bank_accounts(id),
    bank_code VARCHAR(20),
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'p2p')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    flutterwave_reference VARCHAR(255),
    tx_hash VARCHAR(255),
    failure_reason TEXT,
    narration VARCHAR(255),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- P2P orders table
CREATE TABLE IF NOT EXISTS p2p_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    amount_usdc DECIMAL(18, 6) NOT NULL,
    price_per_usdc DECIMAL(18, 8) NOT NULL,
    total_fiat DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled', 'disputed')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matched_with UUID REFERENCES auth.users(id),
    matched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- P2P disputes table
CREATE TABLE IF NOT EXISTS p2p_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    evidence TEXT,
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- P2P reviews table
CREATE TABLE IF NOT EXISTS p2p_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),
    reviewee_id UUID NOT NULL REFERENCES auth.users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_withdrawals_user_id ON fiat_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_withdrawals_status ON fiat_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_type_currency_status ON p2p_orders(type, currency, status);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_created_by ON p2p_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_p2p_reviews_reviewee_id ON p2p_reviews(reviewee_id);

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiat_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_reviews ENABLE ROW LEVEL SECURITY;

-- Bank accounts policies
CREATE POLICY "Users can view their own bank accounts"
    ON bank_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts"
    ON bank_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts"
    ON bank_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Fiat withdrawals policies
CREATE POLICY "Users can view their own withdrawals"
    ON fiat_withdrawals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals"
    ON fiat_withdrawals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can update withdrawals (for webhook processing)
CREATE POLICY "Service role can update withdrawals"
    ON fiat_withdrawals FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- P2P orders policies
CREATE POLICY "Anyone can view open P2P orders"
    ON p2p_orders FOR SELECT
    USING (status = 'open' OR auth.uid() = created_by OR auth.uid() = matched_with);

CREATE POLICY "Authenticated users can create P2P orders"
    ON p2p_orders FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own orders"
    ON p2p_orders FOR UPDATE
    USING (auth.uid() = created_by OR auth.uid() = matched_with);

-- P2P disputes policies
CREATE POLICY "Users can view their own disputes"
    ON p2p_disputes FOR SELECT
    USING (auth.uid() = raised_by OR auth.uid() = resolved_by);

CREATE POLICY "Users can create disputes"
    ON p2p_disputes FOR INSERT
    WITH CHECK (auth.uid() = raised_by);

-- P2P reviews policies
CREATE POLICY "Anyone can view reviews"
    ON p2p_reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews"
    ON p2p_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Bill payments table
CREATE TABLE IF NOT EXISTS bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_type VARCHAR(50) NOT NULL,
    item_code VARCHAR(50),
    amount DECIMAL(18, 2) NOT NULL,
    customer_id VARCHAR(100),
    phone_number VARCHAR(50),
    reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    flutterwave_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill payments policies
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bill payments"
    ON bill_payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create bill payments"
    ON bill_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Virtual accounts table
CREATE TABLE IF NOT EXISTS virtual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flutterwave_ref VARCHAR(255),
    account_number VARCHAR(50) NOT NULL UNIQUE,
    bank_name VARCHAR(255),
    frequency VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    currency VARCHAR(10) DEFAULT 'NGN',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiat deposits table
CREATE TABLE IF NOT EXISTS fiat_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    reference VARCHAR(255) UNIQUE,
    source VARCHAR(50) DEFAULT 'virtual_account',
    account_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Virtual accounts policies
ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own virtual accounts"
    ON virtual_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create virtual accounts"
    ON virtual_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own virtual accounts"
    ON virtual_accounts FOR UPDATE
    USING (auth.uid() = user_id);

-- Fiat deposits policies
ALTER TABLE fiat_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
    ON fiat_deposits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create deposits"
    ON fiat_deposits FOR INSERT
    WITH CHECK (true);

-- Functions

-- Function to get user's P2P rating
CREATE OR REPLACE FUNCTION get_user_p2p_rating(user_uuid UUID)
RETURNS DECIMAL(3, 2) AS $$
DECLARE
    avg_rating DECIMAL(3, 2);
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM p2p_reviews
    WHERE reviewee_id = user_uuid;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fiat_withdrawals_updated_at
    BEFORE UPDATE ON fiat_withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_p2p_orders_updated_at
    BEFORE UPDATE ON p2p_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
