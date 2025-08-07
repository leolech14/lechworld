# LechWorld Security Configuration Guide

This document provides comprehensive instructions for securely managing secrets and authentication tokens in the LechWorld production environment.

## 🔐 Production Security Setup

### Quick Start

1. **Generate Secrets**:
   ```bash
   ./scripts/generate-secrets.sh -v -b
   ```

2. **Review Generated Files**:
   - `.env.production.secrets` - Your actual secrets (NEVER commit)
   - `.vault-secrets.json` - HashiCorp Vault format
   - `security-report-*.txt` - Generation summary

3. **Store Secrets Securely**:
   - Upload to AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
   - Configure your deployment pipeline to inject secrets
   - Delete local secrets files after secure storage

## 📁 File Structure

```
lechworld/
├── .env.production.example     # Template with placeholders (safe to commit)
├── .env.production.secrets     # Actual secrets (NEVER commit - add to .gitignore)
├── .vault-secrets.json         # HashiCorp Vault format (NEVER commit)
├── scripts/
│   └── generate-secrets.sh     # Cryptographically secure secret generator
└── SECURITY.md                 # This guide
```

## 🛡️ Secret Management Best Practices

### 1. Secret Generation Standards

All secrets are generated using cryptographically secure methods:

- **JWT Secrets**: 64 bytes, base64 encoded (`openssl rand -base64 64`)
- **Encryption Keys**: 32 bytes, hex encoded (`openssl rand -hex 32`)
- **Passwords**: 32 bytes, alphanumeric (`openssl rand -base64 32`)
- **API Keys**: 64 bytes, base64 encoded with special character removal

### 2. Secret Storage Options

#### Option A: AWS Secrets Manager (Recommended)
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "lechworld/production/app-secrets" \
  --description "LechWorld production secrets" \
  --secret-string file://.env.production.secrets
```

#### Option B: HashiCorp Vault
```bash
# Upload to HashiCorp Vault
vault kv put secret/lechworld/production @.vault-secrets.json
```

#### Option C: Azure Key Vault
```bash
# Store in Azure Key Vault
az keyvault secret set \
  --vault-name "lechworld-vault" \
  --name "production-secrets" \
  --file .env.production.secrets
```

### 3. Environment Variable Injection

#### Docker/Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lechworld-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: lechworld/api:latest
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: lechworld-secrets
              key: jwt-secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: lechworld-secrets
              key: database-url
```

#### Railway/Vercel Deployment
Use the platform's environment variable interface to inject secrets from your secret store.

## 🔄 Secret Rotation Strategy

### Automated Rotation (Recommended)

1. **Create Rotation Script**:
   ```bash
   #!/bin/bash
   # rotate-secrets.sh
   
   # Generate new secrets
   ./scripts/generate-secrets.sh -f -b
   
   # Update secret store
   aws secretsmanager update-secret \
     --secret-id "lechworld/production/app-secrets" \
     --secret-string file://.env.production.secrets
   
   # Trigger deployment with new secrets
   kubectl rollout restart deployment/lechworld-api
   ```

2. **Schedule Rotation**:
   ```bash
   # Add to crontab for quarterly rotation
   0 2 1 */3 * /path/to/rotate-secrets.sh
   ```

### Manual Rotation Steps

1. Generate new secrets: `./scripts/generate-secrets.sh -f -b`
2. Test secrets in staging environment
3. Update production secret store
4. Deploy with zero-downtime rolling update
5. Verify application health
6. Revoke old secrets after successful deployment

## 🚨 Security Incident Response

### Suspected Secret Compromise

1. **Immediate Actions**:
   ```bash
   # Generate new secrets immediately
   ./scripts/generate-secrets.sh -f
   
   # Update secret store
   # Deploy with new secrets
   # Revoke compromised secrets
   ```

2. **Audit Steps**:
   - Check access logs for unauthorized usage
   - Review deployment logs for secret exposure
   - Scan code repositories for accidental commits
   - Update incident response documentation

### Secret Exposure in Code

1. **Remove from Version Control**:
   ```bash
   # Remove from git history (use with caution)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.production.secrets' \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Immediate Rotation**:
   - Generate new secrets immediately
   - Update all deployment environments
   - Monitor for unauthorized access

## 📊 Security Monitoring

### Recommended Monitoring

1. **Secret Access Monitoring**:
   - Monitor secret retrieval from your secret store
   - Alert on unusual access patterns
   - Log all secret rotation events

2. **Application Security Monitoring**:
   ```javascript
   // JWT token monitoring
   app.use((req, res, next) => {
     if (req.headers.authorization) {
       logger.info('JWT access', {
         ip: req.ip,
         userAgent: req.get('User-Agent'),
         timestamp: new Date().toISOString()
       });
     }
     next();
   });
   ```

3. **Infrastructure Monitoring**:
   - Monitor for unauthorized secret store access
   - Set up alerts for failed authentication attempts
   - Track secret rotation compliance

## 🔐 Environment-Specific Security

### Production Requirements

- **Secret Length**: Minimum 32 bytes for all secrets
- **Encryption**: AES-256 for all data at rest
- **Rotation**: Maximum 90 days between rotations
- **Access Control**: Least-privilege principle
- **Audit Logging**: All secret operations logged

### Development/Staging

- Use separate secrets for each environment
- Never use production secrets in non-production environments
- Implement automated secret validation in CI/CD pipelines

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   ```bash
   # Fix file permissions
   chmod 600 .env.production.secrets
   chmod +x scripts/generate-secrets.sh
   ```

2. **Secret Validation Failures**:
   ```bash
   # Regenerate with stronger validation
   ./scripts/generate-secrets.sh -f --validate-strength
   ```

3. **Deployment Secret Injection Issues**:
   - Verify secret store connectivity
   - Check IAM/RBAC permissions
   - Validate secret key names match application expectations

### Debug Mode

```bash
# Run with debug logging
DEBUG=true ./scripts/generate-secrets.sh -v
```

## 📝 Compliance & Audit

### SOC 2 Compliance

- All secrets encrypted in transit and at rest
- Access logging for all secret operations
- Regular secret rotation (90-day maximum)
- Incident response procedures documented

### Audit Trail

The system maintains comprehensive audit logs:
- Secret generation timestamps
- Access patterns and frequency
- Rotation events and outcomes
- Failed authentication attempts

## 🆘 Emergency Procedures

### Complete Security Reset

```bash
#!/bin/bash
# emergency-reset.sh

echo "🚨 EMERGENCY SECURITY RESET"
echo "This will regenerate ALL secrets and require immediate deployment"

# Backup current state
./scripts/generate-secrets.sh -b

# Generate completely new secrets
./scripts/generate-secrets.sh -f

# Update all secret stores
# (Add your specific secret store update commands here)

echo "✅ Emergency reset complete - deploy immediately!"
```

### Contact Information

- **Security Team**: security@lechworld.com
- **On-Call Engineer**: Use PagerDuty escalation
- **Emergency Hotline**: Available in internal documentation

---

## ⚡ Quick Reference

### Generate Secrets
```bash
./scripts/generate-secrets.sh -v -b
```

### Update Production Secrets
```bash
# AWS Secrets Manager
aws secretsmanager update-secret --secret-id lechworld/production/app-secrets --secret-string file://.env.production.secrets

# HashiCorp Vault
vault kv put secret/lechworld/production @.vault-secrets.json
```

### Emergency Rotation
```bash
./scripts/generate-secrets.sh -f && kubectl rollout restart deployment/lechworld-api
```

### Validate Configuration
```bash
# Test configuration with new secrets
NODE_ENV=production node -e "require('dotenv').config({path: '.env.production.secrets'}); console.log('✅ Configuration valid');"
```

---

**Remember**: Security is not a one-time setup. Regularly review and update your security practices, rotate secrets, and monitor for security incidents. 🔐