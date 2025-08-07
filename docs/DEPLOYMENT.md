# Deployment Documentation

## Overview

This project uses a dual-platform deployment strategy:
- **Frontend**: Deployed to Vercel (optimized for static sites and edge functions)
- **Backend**: Deployed to Railway (optimized for containerized applications and databases)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Setup](#environment-setup)
3. [Deployment Platforms](#deployment-platforms)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Variables](#environment-variables)
6. [Deployment Scripts](#deployment-scripts)
7. [Manual Deployment](#manual-deployment)
8. [Monitoring & Logs](#monitoring--logs)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub                               │
│                    (Source Control)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─── Push to main branch
                       │
              ┌────────▼────────┐
              │  GitHub Actions  │
              │   (CI/CD)        │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌───────────────┐
│    Vercel     │            │    Railway    │
│   (Frontend)  │            │   (Backend)   │
├───────────────┤            ├───────────────┤
│ • React App   │            │ • Node.js API │
│ • Static Files│            │ • PostgreSQL  │
│ • Edge Funcs  │            │ • Redis Cache │
└───────────────┘            └───────────────┘
        │                             │
        └──────────┬──────────────────┘
                   │
                   ▼
           ┌───────────────┐
           │     Users     │
           └───────────────┘
```

## Environment Setup

### Prerequisites

1. **Required Tools**:
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install Vercel CLI
   npm install -g vercel

   # Install Railway CLI
   npm install -g @railway/cli
   ```

2. **Account Setup**:
   - Create a [Vercel account](https://vercel.com/signup)
   - Create a [Railway account](https://railway.app/signup)
   - Link GitHub repository to both platforms

3. **Local Environment Files**:
   ```bash
   # Create environment files
   cp .env.example .env.local        # Local development
   cp .env.example .env.staging      # Staging environment
   cp .env.example .env.production   # Production environment
   ```

## Deployment Platforms

### Vercel (Frontend)

**Configuration**: `vercel.json`

**Features**:
- Automatic HTTPS with SSL certificates
- Global CDN with 70+ edge locations
- Automatic preview deployments for PRs
- Serverless functions support
- Built-in analytics and Web Vitals

**Deployment Regions**:
- Primary: US East (iad1)
- Fallback: Auto-selected based on user location

### Railway (Backend)

**Configuration**: `railway.json`

**Features**:
- Container-based deployments
- Automatic scaling
- Built-in PostgreSQL and Redis
- Private networking between services
- Automatic SSL certificates

**Services**:
- API Server (Node.js)
- PostgreSQL Database
- Redis Cache
- Background Workers (optional)

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

**Pipeline Stages**:

1. **Code Quality** (2-3 mins)
   - Linting (ESLint, Prettier)
   - Type checking (TypeScript)
   - Unit tests (Jest)
   - Integration tests

2. **Security Scanning** (1-2 mins)
   - Vulnerability scanning (Trivy)
   - Dependency audit (npm audit)
   - Secret scanning

3. **Build & Deploy** (5-7 mins)
   - Parallel deployment to Vercel and Railway
   - Database migrations
   - Cache invalidation

4. **Post-Deployment** (2-3 mins)
   - Smoke tests
   - Health checks
   - Performance monitoring setup

### Deployment Triggers

- **Production**: Push to `main` branch
- **Staging**: Push to `staging` branch
- **Preview**: Pull requests to `main`
- **Manual**: Workflow dispatch with environment selection

## Environment Variables

### Frontend (Vercel)

```bash
# Application
VITE_API_URL=https://api.lechworld.railway.app
VITE_APP_URL=https://lechworld.vercel.app
VITE_ENVIRONMENT=production

# Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_POSTHOG_KEY=phc_xxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com

# Error Tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
VITE_FEATURE_AUTH=true
VITE_FEATURE_PAYMENTS=true
```

### Backend (Railway)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://default:pass@host:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://lechworld.vercel.app
CORS_CREDENTIALS=true

# AWS (File Storage)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxx
AWS_REGION=us-west-2
S3_BUCKET=lechworld-assets

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxx
SMTP_FROM=noreply@lechworld.com

# Payments
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx

# External APIs
OPENAI_API_KEY=sk-xxxxxxxxxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Scripts

### Frontend Deployment (Vercel)

```bash
# Deploy to production
./scripts/deploy-vercel.sh production

# Deploy to staging
./scripts/deploy-vercel.sh staging

# Deploy with options
./scripts/deploy-vercel.sh production --force --skip-tests

# Rollback deployment
./scripts/deploy-vercel.sh production rollback

# View deployment history
./scripts/deploy-vercel.sh production history
```

### Backend Deployment (Railway)

```bash
# Deploy API to production
./scripts/deploy-railway.sh production api

# Deploy all services
./scripts/deploy-railway.sh production all

# Deploy with options
./scripts/deploy-railway.sh production api --skip-migrations --force

# Rollback deployment
./scripts/deploy-railway.sh production api rollback

# View logs
./scripts/deploy-railway.sh production api logs

# Check status
./scripts/deploy-railway.sh production api status
```

## Manual Deployment

### Vercel Manual Deployment

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Set environment variables
vercel env add VITE_API_URL production
vercel env pull .env.production
```

### Railway Manual Deployment

```bash
# Login to Railway
railway login

# Link project
railway link

# Deploy to production
railway up --environment production

# Run database migrations
railway run --service api npm run db:migrate

# View logs
railway logs --service api

# Access database
railway connect --service postgres
```

## Monitoring & Logs

### Application Monitoring

1. **Vercel Analytics**:
   - Access: https://vercel.com/lechworld/analytics
   - Metrics: Page views, Web Vitals, User analytics

2. **Railway Metrics**:
   - Access: https://railway.app/project/metrics
   - Metrics: CPU, Memory, Network, Database connections

3. **Sentry Error Tracking**:
   - Access: https://sentry.io/organizations/lechworld
   - Features: Error tracking, Performance monitoring, Release tracking

### Log Management

```bash
# View Vercel logs
vercel logs --follow

# View Railway logs
railway logs --service api --lines 1000

# Download logs for analysis
railway logs --service api > api-logs.txt

# Stream logs in real-time
railway logs --service api --follow
```

### Health Checks

- Frontend: https://lechworld.vercel.app/api/health
- Backend: https://api.lechworld.railway.app/health
- Database: https://api.lechworld.railway.app/health/db
- Redis: https://api.lechworld.railway.app/health/redis

## Rollback Procedures

### Automatic Rollback

Configured in CI/CD pipeline to automatically rollback if:
- Health checks fail after deployment
- Error rate exceeds threshold (>5% 5xx errors)
- Response time degrades (>2x baseline)

### Manual Rollback

1. **Vercel Rollback**:
   ```bash
   # List recent deployments
   vercel list --limit 10

   # Rollback to specific deployment
   vercel rollback [deployment-url]

   # Or use the script
   ./scripts/deploy-vercel.sh production rollback
   ```

2. **Railway Rollback**:
   ```bash
   # Rollback to previous deployment
   railway rollback --service api

   # Or use the script
   ./scripts/deploy-railway.sh production api rollback
   ```

3. **Database Rollback**:
   ```bash
   # Rollback last migration
   railway run --service api npm run db:rollback

   # Rollback to specific migration
   railway run --service api npm run db:rollback --to 20240101000000
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   pnpm run build
   ```

2. **Environment Variable Issues**:
   ```bash
   # Verify environment variables
   vercel env ls production
   railway variables --service api

   # Re-sync environment variables
   vercel env pull
   railway variables export > .env.railway
   ```

3. **Database Connection Issues**:
   ```bash
   # Test database connection
   railway run --service api npm run db:status

   # Reset database pool
   railway run --service api npm run db:reset-pool
   ```

4. **Performance Issues**:
   ```bash
   # Check resource usage
   railway status --service api

   # Scale up service
   railway scale --service api --replicas 3

   # Check slow queries
   railway run --service postgres psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
   ```

### Debug Mode

Enable debug mode for detailed logs:

```bash
# Frontend debugging
DEBUG=* vercel dev

# Backend debugging
DEBUG=* railway run --service api npm run dev

# Deployment script debugging
./scripts/deploy-vercel.sh production --debug
./scripts/deploy-railway.sh production api --debug
```

### Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/support
- **Internal Team**: #deployments channel on Slack
- **On-call Engineer**: Check PagerDuty schedule

## Best Practices

1. **Always deploy to staging first**
2. **Run migrations in a transaction**
3. **Monitor metrics for 15 minutes post-deployment**
4. **Keep deployment logs for audit trail**
5. **Tag releases in Git**
6. **Update this documentation when making changes**

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing in CI
- [ ] Security scan completed
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Staging deployment successful
- [ ] Smoke tests passed on staging
- [ ] Team notified of deployment window
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Post-deployment validation plan ready

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Project Architecture Guide](./ARCHITECTURE.md)
- [Security Guidelines](./SECURITY.md)
- [Performance Optimization Guide](./PERFORMANCE.md)