-- Production Database Initialization Script
-- LechWorld Family Loyalty Program
-- Compatible with Neon, Supabase, Railway PostgreSQL
-- Version: 1.0.0
-- Created: 2024-08-07

-- ============================================================================
-- INITIAL SETUP AND CONFIGURATION
-- ============================================================================

-- Ensure we're using the public schema
SET search_path TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Set timezone for consistent timestamps
SET timezone = 'UTC';

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Families table - Core family units
CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Users table - System users with authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'staff', 'admin')),
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    
    -- Security & Login tracking
    is_first_login BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Family members table - Individual family members
CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('primary', 'extended', 'view_only')),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Profile fields
    cpf TEXT,
    phone TEXT,
    birthdate TEXT, -- YYYY-MM-DD format
    
    -- UI customization
    frame_color TEXT DEFAULT '#FED7E2' NOT NULL,
    frame_border_color TEXT DEFAULT '#F687B3' NOT NULL,
    profile_emoji TEXT DEFAULT '👤' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- LOYALTY PROGRAM TABLES
-- ============================================================================

-- Loyalty programs table - Available loyalty programs
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    code TEXT, -- IATA code for airlines
    program_type TEXT NOT NULL CHECK (program_type IN ('miles', 'points', 'cashback')),
    category TEXT DEFAULT 'airline' NOT NULL CHECK (category IN ('airline', 'hotel', 'credit_card', 'retail')),
    
    -- Visual branding
    logo_color TEXT DEFAULT '#3B82F6' NOT NULL,
    icon_url TEXT,
    
    -- Point valuation
    point_value TEXT DEFAULT '0.01' NOT NULL, -- estimated value per point in BRL
    
    -- Transfer configuration
    transfer_enabled BOOLEAN DEFAULT false NOT NULL,
    min_transfer_amount INTEGER,
    transfer_fee_type TEXT CHECK (transfer_fee_type IN ('flat', 'percentage', 'tiered')),
    transfer_fee_amount INTEGER,
    transfer_partners JSONB, -- JSON array of partner programs
    
    -- Expiration rules
    expiration_months INTEGER,
    extendable_on_activity BOOLEAN DEFAULT false NOT NULL,
    
    -- Contact information
    website TEXT,
    phone_number TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Member programs table - Individual memberships in loyalty programs
CREATE TABLE IF NOT EXISTS member_programs (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    
    -- Account credentials (encrypted)
    account_number TEXT,
    login TEXT,
    site_password_encrypted TEXT,
    miles_password_encrypted TEXT,
    
    -- Member details
    cpf TEXT,
    points_balance INTEGER DEFAULT 0 NOT NULL,
    elite_tier TEXT,
    status_level TEXT DEFAULT 'basic' NOT NULL CHECK (status_level IN ('basic', 'silver', 'gold', 'platinum', 'diamond')),
    
    -- Financial tracking
    yearly_earnings INTEGER DEFAULT 0 NOT NULL,
    yearly_spending INTEGER DEFAULT 0 NOT NULL,
    estimated_value TEXT,
    
    -- Metadata
    notes TEXT,
    custom_fields JSONB,
    expiration_date TIMESTAMP,
    
    -- Audit trail
    last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
    last_updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Prevent duplicate memberships
    UNIQUE(member_id, program_id)
);

-- ============================================================================
-- TRANSACTION AND ACTIVITY TABLES
-- ============================================================================

-- Mile transactions table - Track all points/miles transactions
CREATE TABLE IF NOT EXISTS mile_transactions (
    id SERIAL PRIMARY KEY,
    member_program_id INTEGER NOT NULL REFERENCES member_programs(id) ON DELETE CASCADE,
    miles INTEGER NOT NULL, -- positive for earned, negative for redeemed
    description TEXT NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    expiration_date TIMESTAMP,
    source TEXT NOT NULL CHECK (source IN ('flight', 'credit_card', 'shopping', 'transfer', 'bonus', 'correction', 'other')),
    reference_number TEXT,
    recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Activity log table - Audit trail for all system activities
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES family_members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    category TEXT DEFAULT 'general' NOT NULL CHECK (category IN ('auth', 'security', 'miles', 'account', 'general')),
    description TEXT NOT NULL,
    metadata JSONB,
    
    -- Timestamps
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

-- Notification preferences table - User notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email preferences
    email_enabled BOOLEAN DEFAULT true NOT NULL,
    email_frequency TEXT DEFAULT 'weekly' NOT NULL CHECK (email_frequency IN ('daily', 'weekly', 'monthly')),
    
    -- Alert settings
    expiration_alert_days INTEGER DEFAULT 90 NOT NULL,
    
    -- Other channels
    whatsapp_enabled BOOLEAN DEFAULT false NOT NULL,
    whatsapp_number TEXT,
    push_enabled BOOLEAN DEFAULT false NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- One preference set per user
    UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Families indexes
CREATE INDEX IF NOT EXISTS idx_families_name ON families(name);
CREATE INDEX IF NOT EXISTS idx_families_created_at ON families(created_at);

-- Users indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Family members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_email ON family_members(email);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_active ON family_members(is_active);
CREATE INDEX IF NOT EXISTS idx_family_members_role ON family_members(role);

-- Loyalty programs indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_name ON loyalty_programs(name);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_company ON loyalty_programs(company);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_code ON loyalty_programs(code);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_category ON loyalty_programs(category);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_active ON loyalty_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_transfer_enabled ON loyalty_programs(transfer_enabled);

-- Member programs indexes
CREATE INDEX IF NOT EXISTS idx_member_programs_member_id ON member_programs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_programs_program_id ON member_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_member_programs_active ON member_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_member_programs_status_level ON member_programs(status_level);
CREATE INDEX IF NOT EXISTS idx_member_programs_expiration ON member_programs(expiration_date);
CREATE INDEX IF NOT EXISTS idx_member_programs_points_balance ON member_programs(points_balance);

-- Mile transactions indexes
CREATE INDEX IF NOT EXISTS idx_mile_transactions_member_program_id ON mile_transactions(member_program_id);
CREATE INDEX IF NOT EXISTS idx_mile_transactions_transaction_date ON mile_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_mile_transactions_expiration_date ON mile_transactions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_mile_transactions_source ON mile_transactions(source);
CREATE INDEX IF NOT EXISTS idx_mile_transactions_miles ON mile_transactions(miles);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_member_id ON activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_category ON activity_log(category);
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email_enabled ON notification_preferences(email_enabled);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_families_updated_at ON families;
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loyalty_programs_updated_at ON loyalty_programs;
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECURITY AND PERMISSIONS
-- ============================================================================

-- Create application role (recommended for production)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lechworld_app') THEN
        CREATE ROLE lechworld_app WITH LOGIN PASSWORD 'change_in_production';
    END IF;
END
$$;

-- Grant appropriate permissions
GRANT CONNECT ON DATABASE postgres TO lechworld_app;
GRANT USAGE ON SCHEMA public TO lechworld_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lechworld_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO lechworld_app;

-- Ensure future tables have correct permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lechworld_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO lechworld_app;

-- ============================================================================
-- DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Additional constraints for data integrity
ALTER TABLE users ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE family_members ADD CONSTRAINT check_cpf_format 
    CHECK (cpf IS NULL OR cpf ~ '^\d{11}$');

ALTER TABLE family_members ADD CONSTRAINT check_birthdate_format 
    CHECK (birthdate IS NULL OR birthdate ~ '^\d{4}-\d{2}-\d{2}$');

ALTER TABLE member_programs ADD CONSTRAINT check_points_balance_non_negative 
    CHECK (points_balance >= 0);

ALTER TABLE member_programs ADD CONSTRAINT check_yearly_earnings_non_negative 
    CHECK (yearly_earnings >= 0);

ALTER TABLE member_programs ADD CONSTRAINT check_yearly_spending_non_negative 
    CHECK (yearly_spending >= 0);

-- ============================================================================
-- INITIAL SYSTEM DATA
-- ============================================================================

-- Create system admin family if it doesn't exist
INSERT INTO families (name) VALUES ('System Administration')
ON CONFLICT DO NOTHING;

-- Create system admin user (password should be changed immediately)
DO $$
DECLARE
    admin_family_id INTEGER;
BEGIN
    SELECT id INTO admin_family_id FROM families WHERE name = 'System Administration';
    
    INSERT INTO users (username, email, name, role, family_id, password_hash, is_first_login)
    VALUES (
        'admin',
        'admin@lechworld.com',
        'System Administrator',
        'admin',
        admin_family_id,
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LegQHIKe4SzvUdZO6', -- 'admin123' - CHANGE THIS!
        true
    )
    ON CONFLICT (username) DO NOTHING;
END
$$;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================================================

-- Optimize for application queries
-- These are recommendations for PostgreSQL configuration

COMMENT ON DATABASE postgres IS 'LechWorld Family Loyalty Program Database - Production Schema Initialized';

-- ============================================================================
-- MONITORING AND HEALTH CHECK PREPARATION
-- ============================================================================

-- Create a health check view for monitoring
CREATE OR REPLACE VIEW health_check_summary AS
SELECT 
    'Database Health' as check_name,
    COUNT(DISTINCT f.id) as total_families,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT fm.id) as total_family_members,
    COUNT(DISTINCT lp.id) as total_loyalty_programs,
    COUNT(DISTINCT mp.id) as total_member_programs,
    COUNT(DISTINCT mt.id) as total_transactions,
    NOW() as check_timestamp
FROM families f
LEFT JOIN users u ON f.id = u.family_id
LEFT JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN loyalty_programs lp ON lp.is_active = true
LEFT JOIN member_programs mp ON fm.id = mp.member_id AND mp.is_active = true
LEFT JOIN mile_transactions mt ON mp.id = mt.member_program_id;

-- Create a function to check database connectivity
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(
    status TEXT,
    message TEXT,
    timestamp TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'OK'::TEXT as status,
        'Database is responding normally'::TEXT as message,
        NOW() as timestamp;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
        'ERROR'::TEXT as status,
        ('Database error: ' || SQLERRM)::TEXT as message,
        NOW() as timestamp;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'LechWorld Database Initialization Completed Successfully!';
    RAISE NOTICE 'Schema Version: 1.0.0';
    RAISE NOTICE 'Initialized at: %', NOW();
    RAISE NOTICE 'Tables created: families, users, family_members, loyalty_programs, member_programs, mile_transactions, activity_log, notification_preferences';
    RAISE NOTICE 'Indexes created: % performance-optimized indexes', 25;
    RAISE NOTICE 'Triggers created: 5 automatic timestamp triggers';
    RAISE NOTICE 'Default admin user: admin / admin123 (CHANGE PASSWORD!)';
    RAISE NOTICE '======================================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Change default admin password immediately';
    RAISE NOTICE '2. Run health check: SELECT * FROM health_check();';
    RAISE NOTICE '3. Seed production data: node scripts/db-seed-production.js';
    RAISE NOTICE '4. Configure monitoring: node monitoring/db-health-check.js';
    RAISE NOTICE '======================================================';
END $$;