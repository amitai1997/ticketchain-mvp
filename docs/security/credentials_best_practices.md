# Credentials Management Best Practices

## Overview

This document outlines the best practices for handling credentials and sensitive information in the TicketChain codebase. Following these guidelines will help prevent security incidents like exposure of passwords, API keys, and other secrets.

## Never Hardcode Credentials

❌ **Incorrect:**

```typescript
// pragma: allowlist secret
const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: 'insecure_example',
};
```

✅ **Correct:**

```typescript
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Loaded from environment
};

// Validate required values
if (!dbConfig.password) {
  throw new Error('DB_PASSWORD environment variable must be set');
}
```

## Environment File Management

### Repository Files

- `.env.example` and `.env.template` - Templates with placeholders, safe to commit
- `.env.test` - Test environment configuration without secrets, safe to commit
- `.env` - Local development environment, NEVER commit

### Local Files (Never Commit)

- `.env.local` - Local overrides for dev environment
- `.env.test.local` - Local test environment with actual credentials
- `.env.*.local` - Any environment-specific local overrides

### CI/CD Environment

- Use CI/CD secret management systems (GitHub Secrets, GitLab CI Variables, etc.)
- Never output secrets in CI/CD logs

## Testing with Sensitive Data

1. Always use environment variables for test credentials
2. Create a separate test database with limited permissions
3. For integration tests, consider using:
   - Ephemeral databases (spun up just for tests)
   - Mock services where appropriate
   - Environment-specific configuration

## Detecting Credentials in Code

1. Use pre-commit hooks with tools like:
   - GitGuardian
   - detect-secrets
   - git-secrets
   - Gitleaks

2. Configure your IDE to detect and warn about hardcoded credentials

## What To Do If Credentials Are Exposed

1. **Change the credentials immediately**
2. Assess the impact and scope
3. Document the incident
4. Review commit history to ensure the credential is completely removed
5. Consider using tools like BFG or git-filter-repo to remove sensitive data from Git history

## Secure Alternatives to Hardcoded Credentials

1. Environment variables
2. Secret management services:
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
3. Configuration files loaded at runtime (excluded from VCS)
4. For local development: `.env.*.local` files (excluded from VCS)

## Database Connection Security

1. Use connection pools with proper timeout configurations
2. Create specific database users with minimum required permissions
3. Rotate database credentials regularly
4. Use TLS for database connections where possible
5. Consider using IAM authentication for cloud databases

## Additional Resources

- [OWASP Cheat Sheet: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [The Twelve-Factor App: Config](https://12factor.net/config)
- [NIST Guidelines for Credentials Management](https://pages.nist.gov/800-63-3/sp800-63b.html)
