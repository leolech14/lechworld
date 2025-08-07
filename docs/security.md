# Security Guide for Dream Team Agent System

## Overview

The Dream Team agent system implements multiple layers of security to ensure safe and reliable operation. This guide covers the security measures, best practices, and operational procedures.

## Security Layers

### 1. Guardian Enforcer

The Guardian Enforcer agent validates all operations before execution:

```python
# All operations are validated
Task(subagent_type="guardian-enforcer", prompt="validate deployment to production")
```

Key validations:
- File permission checks
- Secret scanning
- Tool permission verification
- Resource limit enforcement

### 2. File Permissions

Sensitive files are protected with restricted permissions:

```bash
.env files          → 600 (owner read/write only)
config/secrets/*    → 600 (owner read/write only)
.claude/scripts/    → 700 (owner full access only)
.claude/logs/       → 640 (owner write, group read)
```

### 3. Git Hooks

Pre-commit hooks enforce:
- Task ID in commit messages
- Guardian validation
- No hardcoded secrets
- File permission checks

### 4. Resource Limits

Prevents resource exhaustion:

| Resource | Limit | Action at Limit |
|----------|-------|-----------------|
| Parallel Agents | 5 | Queue additional |
| Task Duration | 5 minutes | Timeout & alert |
| Log Size | 100 MB | Rotate logs |
| File Size | 50 MB | Reject upload |

### 5. Input Sanitization

All inputs are sanitized to prevent:
- Path traversal (`../../../etc/passwd`)
- Command injection (`` `rm -rf` ``)
- SQL injection (`'; DROP TABLE--`)
- XSS attacks (`<script>alert()</script>`)

### 6. Audit Trail

All security-relevant operations are logged:

```json
{
  "timestamp": "2024-01-26T10:30:45Z",
  "event_type": "file_access",
  "agent": "backend-specialist",
  "action": "write",
  "severity": "info",
  "details": {
    "file": "/app/src/api/auth.js"
  }
}
```

Audit logs are stored in `.claude/audit/` with daily rotation.

## Operational Security

### Environment Variables

Never commit secrets. Use the provided template:

```bash
cp .env.example .env
# Edit .env with your values
chmod 600 .env
```

For production, use a secure vault like:
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- Doppler

### Destructive Operations

All destructive operations require confirmation:

```bash
# Automated check against policy
DREAM_TEAM_AUTO_MODE=true ./some-destructive-script

# Interactive confirmation
./some-destructive-script
> ⚠️  DESTRUCTIVE ACTION REQUESTED
> Are you sure? (yes/no):
```

Configure allowed operations in `config/allowed_destructive_actions.txt`:

```
delete_test_data
reset_development_db
clean_temp_files
```

### Secret Rotation

Rotate secrets regularly:
- API keys: 90 days
- JWT secrets: 30 days
- Database passwords: 60 days
- Encryption keys: 180 days

### Monitoring

Monitor security events:

```bash
# View recent alerts
tail -f .claude/audit/alerts.ndjson

# Search for violations
grep "security_violation" .claude/audit/*.ndjson

# Check failed operations
grep '"severity":"error"' .claude/audit/*.ndjson
```

## Security Checklist

### Daily Operations
- [ ] Review audit alerts
- [ ] Check resource usage
- [ ] Verify no hanging tasks

### Weekly Maintenance
- [ ] Run `./tools/validate-hardening`
- [ ] Review agent permissions
- [ ] Update dependencies (`npm audit`)
- [ ] Rotate development secrets

### Monthly Security Review
- [ ] Full security scan
- [ ] Review CODEOWNERS
- [ ] Update allowed operations
- [ ] Audit user access

### Incident Response

If a security issue is detected:

1. **Immediate Actions**
   - Stop affected agents
   - Revoke compromised credentials
   - Enable emergency mode

2. **Investigation**
   ```bash
   # Check audit logs
   grep -A10 -B10 "incident_time" .claude/audit/*.ndjson
   
   # Review agent activity
   grep '"agent":"suspected_agent"' .claude/logs/*.ndjson
   ```

3. **Remediation**
   - Fix vulnerability
   - Update security rules
   - Document in `docs/incidents/`

4. **Post-Incident**
   - Security review
   - Update procedures
   - Team training

## Best Practices

### For Developers

1. **Never hardcode secrets**
   ```javascript
   // ❌ Bad
   const apiKey = "sk-1234567890";
   
   // ✅ Good
   const apiKey = process.env.API_KEY;
   ```

2. **Validate all inputs**
   ```python
   # Always sanitize
   from scripts.v2.sanitize import InputSanitizer
   sanitizer = InputSanitizer()
   safe_path = sanitizer.sanitize_path(user_input)
   ```

3. **Use Guardian for sensitive operations**
   ```python
   # Before production changes
   Task(subagent_type="guardian-enforcer", 
        prompt="validate production deployment")
   ```

### For Operators

1. **Regular validation**
   ```bash
   # Run daily
   ./tools/validate-hardening
   ```

2. **Monitor resources**
   ```bash
   # Check agent health
   ./tools/agent-health check all
   ```

3. **Backup audit logs**
   ```bash
   # Archive monthly
   tar -czf audit-$(date +%Y-%m).tar.gz .claude/audit/
   ```

## Security Tools

### Built-in Scripts

| Tool | Purpose | Usage |
|------|---------|-------|
| `harden-system` | Apply security measures | `./tools/harden-system` |
| `validate-hardening` | Check security status | `./tools/validate-hardening` |
| `guardian_check.py` | Validate operations | `python3 .claude/scripts/v2/guardian_check.py` |
| `audit_logger.py` | Log security events | Automatic via agents |
| `sanitize.py` | Clean user input | `python3 .claude/scripts/v2/sanitize.py` |

### External Tools

Recommended security tools:
- **Gitleaks**: Secret scanning in Git
- **Semgrep**: Static analysis
- **OWASP ZAP**: Dynamic security testing
- **Snyk**: Dependency scanning

## Compliance

The system supports compliance with:
- SOC 2 Type II
- GDPR (with configuration)
- HIPAA (with encryption at rest)
- PCI DSS (with network isolation)

Configure compliance mode in `.claude/config/compliance.yaml`.

## Emergency Procedures

### Kill Switch

Stop all agents immediately:

```bash
# Emergency stop
./tools/emergency-stop

# This will:
# 1. Kill all agent processes
# 2. Revoke API tokens
# 3. Enable read-only mode
# 4. Alert administrators
```

### Recovery Mode

Start in safe mode:

```bash
# Limited functionality
DREAM_TEAM_SAFE_MODE=true ./tools/agent-orchestrate

# Only allows:
# - Read operations
# - Guardian validation
# - Audit logging
```

## Contact

For security issues:
- Emergency: Check `.claude/config/oncall.yaml`
- Non-urgent: File issue with `security` label
- Vulnerabilities: Use responsible disclosure

Remember: Security is everyone's responsibility. When in doubt, ask Guardian Enforcer!