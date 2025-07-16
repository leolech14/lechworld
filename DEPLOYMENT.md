# Deployment Guide - MilhasLech

This guide covers deploying MilhasLech to various platforms.

## Quick Deploy Options

### 1. Replit Deployment (Recommended for Development)
1. Click the "Deploy" button in your Replit workspace
2. Configure environment variables in the deployment settings
3. Your app will be available at `https://your-repl-name.replit.app`

### 2. Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### 3. Railway Deployment
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Deploy with built-in PostgreSQL database

### 4. Heroku Deployment
1. Create Heroku app: `heroku create milhaslech`
2. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:mini`
3. Set environment variables: `heroku config:set SESSION_SECRET=your-secret`
4. Deploy: `git push heroku main`

## Environment Variables

Required for all deployments:

```bash
# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security
SESSION_SECRET=your-super-secure-session-secret-key

# Application
NODE_ENV=production
PORT=5000
```

## Database Setup

### PostgreSQL Requirements
- PostgreSQL 12+ with extensions support
- Minimum 100MB storage for development
- 1GB+ recommended for production

### Migration
```bash
npm run db:migrate
```

## Build Process

### Production Build
```bash
# Install dependencies
npm install

# Build frontend and backend
npm run build

# Start production server
npm start
```

### Build Output
- Frontend: `dist/` directory with optimized assets
- Backend: `dist/index.js` bundled server

## Performance Considerations

### Frontend Optimization
- Vite automatically optimizes bundle sizes
- Images are optimized and compressed
- CSS is purged and minified
- JavaScript is tree-shaken and minified

### Backend Optimization
- Express server with gzip compression
- Database connection pooling
- Session store optimization
- Static asset caching

## Security Configuration

### Production Security
```javascript
// Session configuration for production
{
  secure: true,           // HTTPS only
  httpOnly: true,         // Prevent XSS
  maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  sameSite: 'strict'      // CSRF protection
}
```

### HTTPS Setup
- Enable HTTPS in production
- Configure SSL certificates
- Redirect HTTP to HTTPS
- Set secure cookie flags

## Database Scaling

### Connection Pooling
```javascript
// Database pool configuration
{
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,  // Close idle connections
  connectionTimeoutMillis: 2000,  // Connection timeout
}
```

### Read Replicas
- Consider read replicas for high traffic
- Route read queries to replicas
- Keep writes on primary database

## Monitoring & Logging

### Application Logging
```javascript
// Production logging setup
{
  level: 'info',
  format: 'json',
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
}
```

### Health Checks
- Implement `/health` endpoint
- Monitor database connectivity
- Track response times
- Set up alerts for downtime

## Backup Strategy

### Database Backups
- Daily automated backups
- Point-in-time recovery
- Cross-region backup storage
- Regular restore testing

### Application Backups
- Git repository as source of truth
- Environment variables in secure storage
- Regular deployment testing

## Scaling Considerations

### Horizontal Scaling
- Stateless application design
- Session store in database
- Load balancer configuration
- Auto-scaling policies

### Vertical Scaling
- Monitor CPU and memory usage
- Optimize database queries
- Implement caching layers
- Profile performance bottlenecks

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Validate credentials

2. **Session Issues**
   - Ensure SESSION_SECRET is set
   - Check session store connectivity
   - Verify cookie settings

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for errors

4. **Performance Issues**
   - Monitor database query performance
   - Check for memory leaks
   - Optimize frontend bundle sizes

### Debugging Commands
```bash
# Check application logs
npm run logs

# Test database connectivity
npm run db:test

# Verify environment variables
npm run config:check

# Run health checks
curl https://your-app.com/health
```

## Cost Optimization

### Resource Usage
- Monitor CPU and memory usage
- Optimize database queries
- Implement efficient caching
- Use CDN for static assets

### Database Costs
- Regular cleanup of old logs
- Optimize storage usage
- Consider read replicas for scaling
- Monitor connection usage

## Security Checklist

- [ ] HTTPS enabled
- [ ] Secure session configuration
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Input validation enabled
- [ ] Rate limiting configured
- [ ] Error handling secure

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review security advisories
- Monitor performance metrics
- Clean up old activity logs
- Test backup and restore procedures

### Updates
- Use semantic versioning
- Test in staging environment
- Implement rolling deployments
- Monitor post-deployment metrics