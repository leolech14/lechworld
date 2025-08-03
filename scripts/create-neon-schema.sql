-- Neon Database Schema for LechWorld
-- Complete multi-tenant architecture with families support

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS member_programs CASCADE;
DROP TABLE IF EXISTS loyalty_programs CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- Create families table (top-level multi-tenancy)
CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table with family reference
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'staff')),
    family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table (for non-user family members)
CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- Create loyalty_programs table
CREATE TABLE loyalty_programs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('airline', 'hotel', 'other')),
    airline_code TEXT,
    icon_url TEXT,
    mile_value_brl DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_programs table (links family members to loyalty programs)
CREATE TABLE member_programs (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    account_number TEXT,
    points_balance INTEGER DEFAULT 0,
    status TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, program_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_member_programs_member_id ON member_programs(member_id);
CREATE INDEX idx_member_programs_program_id ON member_programs(program_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_programs_updated_at BEFORE UPDATE ON member_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for dashboard data
CREATE OR REPLACE VIEW dashboard_view AS
SELECT 
    fm.id as member_id,
    fm.name as member_name,
    fm.email as member_email,
    lp.name as program_name,
    lp.type as program_type,
    lp.airline_code,
    mp.points_balance,
    mp.status,
    mp.expiry_date,
    lp.mile_value_brl,
    (mp.points_balance * lp.mile_value_brl) as value_brl,
    f.id as family_id,
    f.name as family_name
FROM member_programs mp
JOIN family_members fm ON fm.id = mp.member_id
JOIN loyalty_programs lp ON lp.id = mp.program_id
JOIN families f ON f.id = fm.family_id;

-- Create stored procedure for dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_data(
    p_user_id INTEGER,
    p_activity_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    total_points BIGINT,
    total_value NUMERIC,
    programs_count BIGINT,
    members_count BIGINT,
    expiring_soon_count BIGINT,
    member_totals JSONB,
    program_totals JSONB,
    recent_activities JSONB
) AS $$
DECLARE
    v_family_id INTEGER;
BEGIN
    -- Get the user's family_id
    SELECT family_id INTO v_family_id
    FROM users
    WHERE id = p_user_id;
    
    -- If no family_id, return empty results
    IF v_family_id IS NULL THEN
        RETURN QUERY
        SELECT 
            0::BIGINT,
            0::NUMERIC,
            0::BIGINT,
            0::BIGINT,
            0::BIGINT,
            '[]'::JSONB,
            '[]'::JSONB,
            '[]'::JSONB;
        RETURN;
    END IF;
    
    RETURN QUERY
    WITH family_data AS (
        SELECT 
            mp.member_id,
            fm.name as member_name,
            lp.id as program_id,
            lp.name as program_name,
            lp.type as program_type,
            mp.points_balance,
            lp.mile_value_brl,
            mp.expiry_date,
            mp.updated_at
        FROM member_programs mp
        JOIN family_members fm ON fm.id = mp.member_id
        JOIN loyalty_programs lp ON lp.id = mp.program_id
        WHERE fm.family_id = v_family_id
    )
    SELECT 
        -- Total points
        COALESCE(SUM(fd.points_balance), 0)::BIGINT,
        
        -- Total value in BRL
        COALESCE(SUM(fd.points_balance * fd.mile_value_brl), 0)::NUMERIC,
        
        -- Programs count
        COUNT(DISTINCT fd.program_id)::BIGINT,
        
        -- Members count
        COUNT(DISTINCT fd.member_id)::BIGINT,
        
        -- Expiring soon count (within 90 days)
        COUNT(DISTINCT CASE 
            WHEN fd.expiry_date <= CURRENT_DATE + INTERVAL '90 days' 
            THEN fd.program_id 
        END)::BIGINT,
        
        -- Member totals
        COALESCE(
            (SELECT jsonb_agg(member_summary ORDER BY total_points DESC)
             FROM (
                 SELECT 
                     member_name,
                     SUM(points_balance) as total_points,
                     SUM(points_balance * mile_value_brl) as total_value
                 FROM family_data
                 GROUP BY member_id, member_name
             ) member_summary),
            '[]'::JSONB
        ),
        
        -- Program totals
        COALESCE(
            (SELECT jsonb_agg(program_summary ORDER BY total_points DESC)
             FROM (
                 SELECT 
                     program_name,
                     program_type,
                     SUM(points_balance) as total_points,
                     SUM(points_balance * mile_value_brl) as total_value,
                     COUNT(DISTINCT member_id) as members_count
                 FROM family_data
                 GROUP BY program_id, program_name, program_type
             ) program_summary),
            '[]'::JSONB
        ),
        
        -- Recent activities (limited)
        COALESCE(
            (SELECT jsonb_agg(activity ORDER BY updated_at DESC)
             FROM (
                 SELECT 
                     member_name,
                     program_name,
                     points_balance,
                     updated_at
                 FROM family_data
                 ORDER BY updated_at DESC
                 LIMIT p_activity_limit
             ) activity),
            '[]'::JSONB
        )
    FROM family_data fd;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_data TO PUBLIC;