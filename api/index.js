const express = require('express');
const cors = require('cors');
const authRoutes = require('../server/api/auth');
const dashboardRoutes = require('../server/api/dashboard');
const membersRoutes = require('../server/api/members');
const notificationsRoutes = require('../server/api/notifications');
const programsRoutes = require('../server/api/programs');
const transactionsRoutes = require('../server/api/transactions');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://lechworld.vercel.app', 'https://lech.world', 'http://localhost:4445'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/transactions', transactionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

module.exports = app;