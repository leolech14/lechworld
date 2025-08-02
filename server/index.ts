import express from 'express';
import session from 'express-session';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Using consolidated schema from shared/schema.ts

// Import routes (to be created)
import authRoutes from './api/auth.js';
import membersRoutes from './api/members.js';
import programsRoutes from './api/programs.js';
import transactionsRoutes from './api/transactions.js';
import dashboardRoutes from './api/dashboard.js';
import notificationsRoutes from './api/notifications.js';

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
// PORT should be set by the Universal Localhost Development System
// If PORT is not set, it means the server wasn't started correctly
const PORT = process.env.PORT;
if (!PORT) {
  console.error('❌ PORT environment variable is not set!');
  console.error('Please use the "dev" command to start the server with proper port configuration.');
  console.error('Run: dev');
  process.exit(1);
}

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld';
const isSupabase = connectionString.includes('supabase.co');

const pool = new pg.Pool({
  connectionString,
  ...(isSupabase ? {
    ssl: {
      rejectUnauthorized: false
    }
  } : {})
});

export const db = drizzle(pool);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log the response status when it's sent
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response Status: ${res.statusCode}`);
    if (res.statusCode === 404) {
      console.log('404 DETECTED! URL:', req.url);
      console.log('Available routes:', app._router.stack.filter(r => r.route).map(r => `${Object.keys(r.route.methods)} ${r.route.path}`));
    }
    originalSend.call(this, data);
  };
  
  next();
});

// Session configuration - DISABLED in favor of JWT authentication
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'lechworld-secret-key',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//   },
// }));

// CORS configuration for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Allow requests from any origin in development
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// Static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  app.get('*', (req, res) => {
    res.sendFile(new URL('../client/dist/index.html', import.meta.url).pathname);
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();