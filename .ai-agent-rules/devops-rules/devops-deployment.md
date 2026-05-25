# DevOps & Deployment Standards

## CI/CD Pipeline

### GitHub Actions (Already Configured)

PR workflow (`.github/workflows/pr.yml`) runs on every pull request:
1. **Checkout** code
2. **Setup** pnpm + Node.js 22
3. **Lint** — `pnpm lint`
4. **Test** — `pnpm test` (Vitest, JUnit report uploaded)
5. **Build** — `pnpm build`

Dependabot workflow auto-merges after CI passes.

### Pipeline Requirements
- All checks must pass before merge
- Run tests automatically on every PR
- Build and test before deployment

## Deployment Platform: Vercel

### How It Works
- Vercel auto-deploys on push to `main`
- Preview deployments for every PR branch
- Instant rollback to any previous deployment

### Vercel Services Used
- **Hosting**: Vercel Edge Network
- **Database**: Vercel PostgreSQL (free tier)
- **Storage**: Vercel Blob (free tier, for file uploads)
- **Analytics**: Vercel Analytics (optional)

## Environment Management

### Environment Types
- **Development** — Local (`.env` file, local database or Vercel dev)
- **Preview** — Vercel preview deployments (per PR)
- **Production** — Vercel production deployment

### Environment Configuration
- Use Vercel dashboard for production/preview environment variables
- Use `.env` locally (gitignored)
- Maintain `.env.sample` with all required variable names (no values)
- Never use production data in development
- Never commit secrets to the repository

## Deployment Process

### Pre-Deployment Checklist
- [ ] All tests passing (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Code review approved
- [ ] Environment variables configured on Vercel
- [ ] Database migrations ready (if schema changed)

### Deployment Steps
1. Push to `main` (or merge PR)
2. Vercel automatically builds and deploys
3. Run database migrations if needed (`pnpm exec prisma migrate deploy`)
4. Verify production deployment
5. Monitor for errors

### Database Migrations in Production
```bash
# Migrations should run as part of the build or postbuild script
# Add to package.json scripts:
"postbuild": "prisma migrate deploy"
```

## Rollback Procedures

### Vercel Instant Rollback
- Vercel provides instant rollback to any previous deployment
- Use the Vercel dashboard to revert
- No downtime during rollback

### When to Rollback
- Error rate spikes after deployment
- Critical feature broken
- Database migration failed (requires separate DB rollback plan)

### Manual Rollback Process
1. Identify the issue
2. Rollback via Vercel dashboard (instant)
3. Investigate root cause
4. Fix and redeploy

## Post-Deployment Monitoring

### Verify After Deployment
- Application is accessible
- Critical features work (appointment booking, login)
- Database connections are stable
- No error spikes in logs
- Health check endpoint responds (`/api/health`)

### Monitoring Tools
- Vercel Analytics for performance
- Vercel Logs for errors
- Health check endpoint for uptime monitoring

## Infrastructure Notes

### Vercel Handles
- SSL/TLS certificates (automatic)
- CDN and edge caching
- Serverless function scaling
- Preview deployments per PR
- Automatic HTTPS

### Developer Responsibilities
- Keep dependencies updated (Dependabot helps)
- Monitor database usage (Vercel Postgres free tier limits)
- Monitor blob storage usage (Vercel Blob free tier limits)
- Manage environment variables via Vercel dashboard
