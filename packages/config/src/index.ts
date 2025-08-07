import { config as loadEnv } from 'dotenv';
import Joi from 'joi';

// Load environment variables
loadEnv();

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  JWT_SECRET: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  AGENT_TIMEOUT: Joi.number().default(30000),
  MAX_CONCURRENT_AGENTS: Joi.number().default(10),
  ENABLE_METRICS: Joi.boolean().default(true),
  ENABLE_TRACING: Joi.boolean().default(false),
});

const { error, value: config } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export interface Config {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  LOG_LEVEL: string;
  AGENT_TIMEOUT: number;
  MAX_CONCURRENT_AGENTS: number;
  ENABLE_METRICS: boolean;
  ENABLE_TRACING: boolean;
}

export default config as Config;

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';