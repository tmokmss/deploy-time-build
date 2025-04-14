# Developer Notes for deploy-time-build

This document contains helpful information for developers working on the `deploy-time-build` project.

## Pull Request Guidelines

### PR Title Format

All text in PR title or description must be written in English.

Pull request titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. Only the following prefixes are allowed:

- `feat:` - For new features
- `fix:` - For bug fixes
- `chore:` - For maintenance tasks, dependencies updates, etc.

Examples:
- `feat: add support for arm64 instances`
- `fix: resolve build failure on Windows`
- `chore: update dependency versions`

PRs with titles not following this format will fail validation checks.

## Project Structure

- `src/` - Main source code
  - `container-image-build.ts` - Container image building functionality
  - `nodejs-build.ts` - NodeJS build functionality
  - `soci-index-build.ts` - SOCI index functionality
  - `singleton-project.ts` - Utility for creating singleton CodeBuild projects
  - `types.ts` - Type definitions

## Build

You should make sure the build succeeds by the following command before commiting a change:

```bash
npm run build
```

After a successful build, several files such as API.md might be updated. Please check git status and commit them if there are any changes.

## Testing

The project uses snapshot tests for integration testing. When making infrastructure changes that affect the generated CloudFormation templates, you'll need to update the snapshot tests.

### Updating Snapshot Tests

When you make changes that intentionally alter the infrastructure (like adding new resources or changing existing ones), the snapshot tests will fail. This is expected behavior.

After your changes are approved and merged, update the snapshot tests by running:

```bash
npx integ-runner --update-on-failed
```

## Common Issues

### Breaking Changes in Infrastructure

Some changes will create new resources and destroy old ones. This should be clearly noted in PRs.

## CI/CD Pipeline

The CI pipeline runs tests that verify the snapshot templates. Breaking changes will cause these tests to fail. When submitting PRs with intentional breaking changes, clearly document that these failures are expected.
