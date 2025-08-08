import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';

// Load environment variables
config();

// Create Express app
const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Lechworld API',
    version: '1.0.1',
    status: 'online',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login'
    },
    documentation: 'https://lech.world/docs',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development',
    buildTime: '2025-08-07T18:58:00Z'
  });
});

// Basic auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple mock auth for now
  if (username && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 1,
        username,
        name: 'Test User'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// GET /api/auth/me endpoint for checking current user
app.get("/api/auth/me", (req, res) => {
  res.json({
    id: 1,
    username: "test",
    name: "Test User"
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API server running on port ${port}`);
  console.log(`📍 Health check: http://0.0.0.0:${port}/health`);
});

export default app;