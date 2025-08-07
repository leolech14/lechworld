import type { Config } from "drizzle-kit";
import { config } from 'dotenv';

// Load environment variables from root
config({ path: '../../.env' });

export default {
  schema: "./src/schema.ts",
  out: "./src/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgresql://orchestrator:orchestrator123@localhost:5432/orchestrator",
  },
  verbose: true,
  strict: true,
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public',
  },
} satisfies Config;