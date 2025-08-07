import express from 'express';

const app = express();
const PORT = process.env.PORT || 3456;

// Simulate server startup time
const STARTUP_DELAY = 5000; // 5 seconds
let serverReady = false;

// Health endpoint that agents can poll
app.get('/health', (req, res) => {
  if (!serverReady) {
    res.status(503).json({
      status: 'starting',
      message: 'Server is still initializing...',
      progress: Math.round((Date.now() - startTime) / STARTUP_DELAY * 100)
    });
  } else {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Simple endpoint to test
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const startTime = Date.now();

// Simulate async initialization
setTimeout(() => {
  serverReady = true;
  console.log('✅ Server initialization complete');
}, STARTUP_DELAY);

app.listen(PORT, () => {
  console.log(`🚀 Server starting on port ${PORT}...`);
  console.log(`⏳ Initializing (will take ${STARTUP_DELAY/1000} seconds)...`);
});