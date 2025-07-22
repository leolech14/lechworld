# LechWorld Deployment Checklist

## Pre-flight
- [ ] Backup milhaslech data
- [ ] Have MongoDB credentials ready
- [ ] Install Fly CLI: `curl -L https://fly.io/install.sh | sh`

## Supabase Setup
- [ ] Create account at supabase.com
- [ ] Create new project "lechworld"
- [ ] Copy credentials:
  - [ ] Project URL: ___________________________
  - [ ] Anon Key: _____________________________
  - [ ] Service Key: ___________________________
  - [ ] Database URL: __________________________
- [ ] Run schema in SQL Editor

## Local Setup
- [ ] Create .env file with credentials
- [ ] Test build: `npm run build`

## Fly.io Deployment
- [ ] Login: `fly auth login`
- [ ] Launch: `fly launch --name lechworld --region gru --no-deploy`
- [ ] Set secrets: `fly secrets set ...`
- [ ] Deploy: `fly deploy`
- [ ] App URL: https://lechworld.fly.dev

## Data Migration
- [ ] Export MongoDB credentials from milhaslech
- [ ] Run migration script
- [ ] Verify data in Supabase

## Testing
- [ ] Access app at fly.dev URL
- [ ] Test login
- [ ] Test CRUD operations
- [ ] Test WhatsApp integration

## Post-deployment
- [ ] Change default passwords
- [ ] Enable backups
- [ ] Update DNS (if custom domain)
- [ ] Sunset milhaslech app

## Notes:
_________________________________
_________________________________
_________________________________