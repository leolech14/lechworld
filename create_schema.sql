-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create members table
CREATE TABLE IF NOT EXISTS public.members (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create points table
CREATE TABLE IF NOT EXISTS public.points (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES public.members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create programs table
CREATE TABLE IF NOT EXISTS public.programs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  points_per_unit INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create member_programs table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.member_programs (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES public.members(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES public.programs(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, program_id)
);

-- Create point_transactions table
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES public.members(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES public.programs(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES public.members(id) ON DELETE CASCADE,
  reward_id INTEGER REFERENCES public.rewards(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_members_email ON public.members(email);
CREATE INDEX idx_points_member_id ON public.points(member_id);
CREATE INDEX idx_member_programs_member_id ON public.member_programs(member_id);
CREATE INDEX idx_member_programs_program_id ON public.member_programs(program_id);
CREATE INDEX idx_point_transactions_member_id ON public.point_transactions(member_id);
CREATE INDEX idx_point_transactions_program_id ON public.point_transactions(program_id);
CREATE INDEX idx_reward_redemptions_member_id ON public.reward_redemptions(member_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Members: Authenticated users can view all members
CREATE POLICY "Authenticated users can view members" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert members" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update members" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete members" ON public.members FOR DELETE TO authenticated USING (true);

-- Points: Authenticated users can view all points
CREATE POLICY "Authenticated users can view points" ON public.points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage points" ON public.points FOR ALL TO authenticated USING (true);

-- Programs: Everyone can view programs, authenticated users can manage
CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can manage programs" ON public.programs FOR ALL TO authenticated USING (true);

-- Member Programs: Authenticated users can manage
CREATE POLICY "Authenticated users can view member programs" ON public.member_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage member programs" ON public.member_programs FOR ALL TO authenticated USING (true);

-- Point Transactions: Authenticated users can manage
CREATE POLICY "Authenticated users can view transactions" ON public.point_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create transactions" ON public.point_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Rewards: Everyone can view, authenticated users can manage
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users can manage rewards" ON public.rewards FOR ALL TO authenticated USING (true);

-- Reward Redemptions: Authenticated users can manage
CREATE POLICY "Authenticated users can view redemptions" ON public.reward_redemptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage redemptions" ON public.reward_redemptions FOR ALL TO authenticated USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_points_updated_at BEFORE UPDATE ON public.points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_member_programs_updated_at BEFORE UPDATE ON public.member_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reward_redemptions_updated_at BEFORE UPDATE ON public.reward_redemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default programs
INSERT INTO public.programs (name, type, description, points_per_unit) VALUES
  ('Purchase Points', 'purchase', 'Earn points for every dollar spent', 10),
  ('Referral Program', 'referral', 'Earn points for referring friends', 500),
  ('Social Media', 'social', 'Earn points for social media engagement', 50),
  ('Birthday Bonus', 'special', 'Annual birthday points bonus', 1000),
  ('Review Rewards', 'engagement', 'Earn points for product reviews', 100);

-- Insert default rewards
INSERT INTO public.rewards (name, description, points_required, available) VALUES
  ('$10 Discount', 'Get $10 off your next purchase', 1000, true),
  ('$25 Discount', 'Get $25 off your next purchase', 2000, true),
  ('$50 Discount', 'Get $50 off your next purchase', 3500, true),
  ('Free Shipping', 'Free shipping on your next order', 500, true),
  ('VIP Access', 'Early access to sales and new products', 5000, true),
  ('Birthday Special', 'Special birthday gift', 2500, true);

-- Create admin user (password: lechworld2025)
-- Note: This user creation should be done via Supabase Auth API
-- The following is just a placeholder to document the admin credentials