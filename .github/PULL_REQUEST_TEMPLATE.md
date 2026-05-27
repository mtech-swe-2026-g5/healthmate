<!-- 
  SEMANTIC RELEASE GUIDE:
  - This repository uses Semantic Release with Conventional Commits
  - Commit messages are automatically parsed to determine version bumps
  - PR title should follow the format: type(scope): description
  - Prefix determines version bump: fix→patch, feat→minor, breaking→major
-->

## Description
<!-- Briefly explain what this change does and why -->


## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] 🐛 Bug fix (`fix:` prefix) → PATCH version
- [ ] ✨ Feature (`feat:` prefix) → MINOR version  
- [ ] 💥 Breaking change (`BREAKING CHANGE:` in body) → MAJOR version
- [ ] 📝 Documentation (`docs:` prefix)
- [ ] 🔧 Chore (`chore:` prefix)
- [ ] ♻️ Refactor (`refactor:` prefix)
- [ ] ⚡ Performance (`perf:` prefix)

## PR Title Format
<!-- Examples of proper PR titles:
  - fix: resolve login validation error
  - feat: add dark mode support
  - feat(auth)!: redesign login flow (breaking)
  - docs: update README
-->

Ensure your PR title starts with: `type(optional-scope): description`

## Commit Messages
<!-- 
  - Use lowercase for consistency
  - First line max 50 chars
  - For breaking changes, include in commit body or use ! after type
  - Example: "feat(api)!: change response format"
  - Example body: "BREAKING CHANGE: response.user is now response.userData"
-->

## Testing
- [ ] Added/updated tests for this change
- [ ] All tests passing locally

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No new warnings generated
