# Dependency Management Standards

## Package Manager

- **Manager**: pnpm (v11.2.2, declared via `packageManager` field in `package.json`)
- **Commands**: `pnpm add`, `pnpm install`, `pnpm remove`
- **Lock file**: `pnpm-lock.yaml` (always commit, never edit manually)
- **Never** use npm or yarn in this project — pnpm only

## Regular Updates

### Update Process
- Dependabot is configured for weekly automated PRs (Fridays at 4pm IST)
- Dependabot auto-merges after CI passes (lint → test → build)
- Review changelogs for major version bumps manually
- Test updates in development environment first

### Update Strategy
- Review changelogs before updating
- Test updates in development environment first
- Update one major version at a time when possible
- Keep a record of updates and their impact
- Communicate breaking changes to team

## Vulnerability Scanning

### Scanning Tools
- Dependabot is configured for automated vulnerability alerts
- Run `pnpm audit` periodically for manual checks

### Severity Levels
- **Critical**: Fix immediately
- **High**: Fix within 24 hours
- **Medium**: Fix within 1 week
- **Low**: Fix within 1 month or next scheduled update

## Package Management

### Lock Files
- Commit `pnpm-lock.yaml` to version control
- Never manually edit lock files
- Regenerate lock files after dependency changes (`pnpm install`)

### Version Pinning
- Use specific versions for critical dependencies (Next.js, Prisma)
- Use ranges for development dependencies (`^` prefix is fine for devDeps)
- Document version pinning decisions

### Package Installation
- Use pnpm consistently across the team
- Never mix package managers (no `npm install`, no `yarn add`)
- Clean install after major dependency changes (`pnpm install --frozen-lockfile` in CI)

## Dependency Review Process

### Before Adding a New Dependency

Ask these questions:
1. **Is it necessary?** Can we use built-in solutions?
2. **Is it well-maintained?** Check GitHub stars, recent commits, issues
3. **License compatibility?** MIT/Apache preferred
4. **Bundle size impact?** Check with bundlephobia.com
5. **TypeScript support?** Does it have type definitions?
6. **Security record?** Check for known vulnerabilities
7. **Alternatives?** Are there lighter alternatives?

### Built-in Alternatives
Prefer native/built-in solutions:
- **Dates**: Use native `Date` API or `date-fns` (lighter than moment.js)
- **HTTP**: Use native `fetch` (instead of axios for simple cases)
- **Validation**: Use Zod (instead of multiple validation libraries)
- **Env loading**: Next.js auto-loads `.env` files (no dotenv needed in app)

## Minimize Dependencies

- Only add dependencies when necessary
- Prefer built-in solutions when available
- Regularly audit and remove unused dependencies
- Consider alternatives with fewer sub-dependencies
- Run `pnpm prune` to remove unused packages

## Current Key Dependencies

### Runtime
- `next` 16.2.6, `react` 19.2.6, `react-dom` 19.2.6

### Dev
- `typescript` ^6, `tailwindcss` ^4, `eslint` ^9
- `vitest` ^4, `@testing-library/react` ^16, `jsdom` ^29
- `@vitest/coverage-v8` ^4, `@vitejs/plugin-react` ^6

### To Be Added (as features develop)
- `prisma` + `@prisma/client` — ORM
- `zod` — validation
- `react-hook-form` + `@hookform/resolvers` — forms
- Auth library (TBD)
