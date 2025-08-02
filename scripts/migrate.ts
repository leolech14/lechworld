import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  const db = drizzle(pool);

  try {
    // First, let's try to push the schema directly using SQL
    const client = await pool.connect();
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "password" text NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "airlines" (
        "id" serial PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "name" text NOT NULL,
        "program_name" text NOT NULL,
        "transfer_enabled" boolean DEFAULT false,
        "min_transfer_amount" integer,
        "transfer_fee_type" text,
        "transfer_fee_amount" integer,
        "transfer_fee_points" integer,
        "transfer_delay_hours" integer DEFAULT 0,
        "expiration_months" integer,
        "extendable_on_activity" boolean DEFAULT false,
        "google_wallet_supported" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "airlines_code_unique" UNIQUE("code")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "family_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "name" text NOT NULL,
        "email" text,
        "profile_photo" text,
        "color" text DEFAULT '#3b82f6',
        "role" text DEFAULT 'member',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "member_programs" (
        "id" serial PRIMARY KEY NOT NULL,
        "member_id" integer NOT NULL,
        "airline_id" integer NOT NULL,
        "member_number" text NOT NULL,
        "status_level" text,
        "current_miles" integer DEFAULT 0 NOT NULL,
        "lifetime_miles" integer DEFAULT 0,
        "pin" text,
        "document_number" text,
        "document_type" text,
        "google_wallet_enabled" boolean DEFAULT false,
        "last_sync_date" timestamp,
        "sync_method" text,
        "account_password" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "mile_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "member_program_id" integer NOT NULL,
        "miles" integer NOT NULL,
        "description" text NOT NULL,
        "transaction_date" date NOT NULL,
        "expiration_date" date,
        "source" text NOT NULL,
        "reference_number" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "activity_log" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "action" text NOT NULL,
        "description" text NOT NULL,
        "metadata" json,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "email_enabled" boolean DEFAULT true,
        "email_frequency" text DEFAULT 'weekly',
        "expiration_alert_days" integer DEFAULT 90,
        "whatsapp_enabled" boolean DEFAULT false,
        "whatsapp_number" text,
        "push_enabled" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
      );
    `);

    // Add foreign keys
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "member_programs" ADD CONSTRAINT "member_programs_member_id_family_members_id_fk" 
        FOREIGN KEY ("member_id") REFERENCES "family_members"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "member_programs" ADD CONSTRAINT "member_programs_airline_id_airlines_id_fk" 
        FOREIGN KEY ("airline_id") REFERENCES "airlines"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "mile_transactions" ADD CONSTRAINT "mile_transactions_member_program_id_member_programs_id_fk" 
        FOREIGN KEY ("member_program_id") REFERENCES "member_programs"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_user_activity" ON "activity_log" ("user_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_activity_created" ON "activity_log" ("created_at");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "unique_member_program" ON "member_programs" ("member_id","airline_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_member_program" ON "mile_transactions" ("member_program_id");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "idx_expiration" ON "mile_transactions" ("expiration_date");`);

    client.release();
    
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();