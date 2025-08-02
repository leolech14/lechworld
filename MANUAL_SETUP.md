# 🚀 Manual Database Setup Instructions

Since we're having DNS issues connecting to your Supabase database programmatically, let's set it up manually through the Supabase dashboard.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/losjjureznviaoeefzet
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

## Step 2: Run Migration Scripts

Copy and paste each of these SQL scripts one by one and click "Run":

### Script 1: Create Users Table with Authentication
```sql
-- Create users table with authentication support
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  family_member_id INTEGER,
  is_first_login BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_ci ON users (LOWER(username));
```

### Script 2: Create All Tables
Copy the contents of `/Users/lech/PROJECT_lechworld/migrations/003_complete_schema.sql` and run it.

### Script 3: Insert Users
```sql
-- Create the 5 users (no passwords - they'll set them on first login)
INSERT INTO users (username, email, name, role, is_first_login) VALUES
('leonardo', 'leonardo@lech.world', 'Leonardo', 'member', true),
('graciela', 'graciela@lech.world', 'Graciela', 'member', true),
('osvandre', 'osvandre@lech.world', 'Osvandré', 'member', true),
('marilise', 'marilise@lech.world', 'Marilise', 'member', true),
('denise', 'denise@lech.world', 'Denise', 'staff', true)
ON CONFLICT (username) DO NOTHING;
```

### Script 4: Create Loyalty Programs
```sql
-- Insert all loyalty programs with correct point values
INSERT INTO loyalty_programs (name, company, code, program_type, category, point_value, is_active) VALUES
('LATAM Pass', 'LATAM Airlines', 'LA', 'miles', 'airline', '0.030', true),
('Smiles', 'GOL', 'G3', 'miles', 'airline', '0.025', true),
('TudoAzul', 'Azul', 'AD', 'miles', 'airline', '0.028', true),
('AAdvantage', 'American Airlines', 'AA', 'miles', 'airline', '0.040', true),
('Miles&Smiles', 'Turkish Airlines', 'TK', 'miles', 'airline', '0.035', true),
('ConnectMiles', 'Copa Airlines', 'CM', 'miles', 'airline', '0.032', true)
ON CONFLICT DO NOTHING;
```

### Script 5: Create Family Members
```sql
-- Create family members
INSERT INTO family_members (name, email, role, is_active) VALUES
('Osvandré', 'osvandre@lech.world', 'member', true),
('Marilise', 'marilise@lech.world', 'member', true),
('Graciela', 'graciela@lech.world', 'member', true),
('Leonardo', 'leonardo@lech.world', 'member', true)
ON CONFLICT DO NOTHING;
```

### Script 6: Import Real Account Data
Run the member programs insert from the JSON data - I'll create this script for you.

## Step 3: Alternative - Use Local Development

If you prefer local development without Supabase:

1. Install PostgreSQL locally:
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. Create local database:
   ```bash
   createdb lechworld
   ```

3. Update .env:
   ```
   DATABASE_URL=postgresql://localhost:5432/lechworld
   ```

4. Run the scripts:
   ```bash
   npm run db:migrate
   npm run db:seed-users
   npm run db:import-real
   npm run db:update-values
   ```

## Step 4: Start the Application

Once the database is set up (either way):

```bash
npm run dev
```

The app will be available at http://localhost:5000

Users can login with:
- leonardo
- graciela
- osvandre
- marilise
- denise

They'll be prompted to create a password on first login.