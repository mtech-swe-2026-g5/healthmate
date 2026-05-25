# Code Review Standards

## Mandatory Code Reviews

All code must be reviewed by at least one other developer before merging to main branch.

## Review Checklist

Reviewers should check for:
- Code quality and adherence to standards
- Security vulnerabilities
- Performance implications
- Test coverage and quality
- Documentation completeness
- Error handling
- Edge cases (scheduling conflicts, concurrent bookings, timezone handling)
- Patient data privacy

## Pull Request Requirements

- Use pull request templates
- Provide clear description of changes
- Link related issues/tickets
- Include screenshots for UI changes
- Ensure all CI checks pass (lint → test → build)
- Keep PRs focused and reviewable (< 500 lines when possible)
- Ensure tests pass before requesting review

## Review Process

### Review Guidelines
- Address all review comments before merging
- Use "Request Changes" for significant issues
- Approve only when code meets all standards
- Require at least one approval

### Review Turnaround
- Regular PRs: Review within 24–48 hours during business days
- Urgent/Hotfix PRs: Review within 4 hours

## As Author

- Self-review before requesting review
- Run linter and tests locally (`pnpm lint && pnpm test`)
- Add comments explaining complex changes
- Respond to all review comments
- Keep PRs focused on single changes

## As Reviewer

- Be constructive and respectful
- Focus on logic, patterns, and maintainability
- Don't nitpick style (let tools handle that)
- Approve if changes are good enough (not perfect)
- Provide specific, actionable feedback
- Focus on code, not the developer

## Feature-Specific Review Guidelines

### Feature Boundaries
When reviewing features, ensure:
- Feature boundaries and public APIs are carefully reviewed
- Features remain independent
- Proper use of shared code
- Tests are included
- Documentation is updated

## Forbidden Practices (Strict Prohibition)

These practices are strictly forbidden and will block PR approval:

1. **No hardcoded secrets.** All secrets must be in environment variables.
2. **No bypassing validations.** Always validate on both client and server.
3. **No direct DB edits without proper validation.** All database changes must go through Prisma migrations.
4. **No skipping tests or edge cases.** All code must have appropriate test coverage.
5. **No shortcuts that compromise architecture.** Maintain architectural integrity.
6. **No insecure patterns** (raw queries without parameterization, etc.).
7. **No committing secrets or sensitive data** to version control.
8. **No disabling security features** (CSRF protection, rate limiting) for convenience.
9. **No production debugging code** (`console.log`, debug statements) in committed code. Use proper logging.
10. **No ignoring linter errors** without proper justification.
11. **No merging code with failing tests** or below coverage thresholds.
12. **No using deprecated or unsupported libraries** without a migration plan.
