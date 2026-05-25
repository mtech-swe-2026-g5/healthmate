# Git Workflow & Version Control

## Git Workflow

### Branching Strategy
- Use GitHub Flow (feature branches → main)
- Protect `main` branch (require PR, no direct pushes)
- Use feature branches for new work
- Delete merged branches

### Branch Naming
Use consistent branch naming:
- Feature: `feature/description` (e.g., `feature/appointment-booking`, `feature/doctor-dashboard`)
- Fix: `fix/description` (e.g., `fix/scheduling-conflict`, `fix/reminder-timing`)
- Refactor: `refactor/description` (e.g., `refactor/appointment-service`)
- Hotfix: `hotfix/description` (e.g., `hotfix/booking-crash`)
- Chore: `chore/description` (e.g., `chore/update-dependencies`)

## Commit Messages

### Conventional Commits Format
```
type(scope): subject

body (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat(appointments): add booking flow with conflict detection`
- `feat(doctors): add schedule management dashboard`
- `fix(reminders): resolve duplicate SMS sending`
- `fix(booking): prevent double-booking for same time slot`
- `docs(readme): update setup instructions for pnpm`
- `refactor: simplify appointment service layer`
- `test: add unit tests for scheduling conflict logic`
- `chore(deps): bump react from 19.2.4 to 19.2.6`

### Commit Message Best Practices
- Write clear, descriptive commit messages
- Reference issue/ticket numbers when applicable
- Keep subject line under 72 characters
- Use imperative mood ("add feature" not "added feature")
- Explain "what" and "why" in the body, not "how"

## Pull Requests

### Pull Request Process
- Create PRs for all changes
- Use descriptive PR titles and descriptions
- Link related issues/tickets
- Request appropriate reviewers
- Ensure CI/CD passes before merging (lint → test → build)
- Keep PRs focused and reviewable (< 500 lines when possible)
- Ensure tests pass before requesting review

### Merge Strategy
- Prefer squash and merge for feature branches
- Keep commit history clean and meaningful
- Use merge commits for long-lived branches

## Version Control Best Practices

### General Guidelines
- Never commit secrets or sensitive data to version control
- Use `.gitignore` properly to exclude sensitive files
- Review changes before committing (`git diff`, `git status`)
- Commit related changes together
- Don't commit broken code (use `git stash` or feature branches)
- Keep commits atomic (one logical change per commit)

### Code Ownership
- Use CODEOWNERS file for critical paths
- Assign code owners for different modules
