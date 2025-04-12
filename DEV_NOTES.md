# Developer Notes for deploy-time-build

This document contains helpful information for developers working on the `deploy-time-build` project.

## Pull Request Guidelines

### PR Title Format

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

## Key Components

### SingletonProject

The `SingletonProject` class creates a CodeBuild project that is unique per stack. It ensures that projects with the same purpose but different configurations (e.g., different platforms) are created separately. The uniqueness is controlled by:

- `uuid` - A unique identifier for the project type
- `projectPurpose` - A descriptive name
- Additional properties added to the slug via `propsToAdditionalString()`

Important: When adding new variations of projects, make sure to update the `propsToAdditionalString()` method.

### ContainerImageBuild

This construct handles building container images during CDK deployment. It supports:

- Platform-specific builds (amd64/arm64)
- Repository management
- Build command construction

When building for arm64 platform, it uses `LinuxArmBuildImage` with an ARM-based CodeBuild instance for better performance.

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

When working with `SingletonProject`, adding new dimensions of uniqueness (like platform-specific builds) will create new resources and destroy old ones. This is expected behavior but should be clearly noted in PRs.

### Build Performance

Building ARM64 images on x86 instances is slow due to emulation. That's why platform-specific build instances were introduced. Always use the appropriate build image for the target platform.

## CI/CD Pipeline

The CI pipeline runs tests that verify the snapshot templates. Breaking changes will cause these tests to fail. When submitting PRs with intentional breaking changes, clearly document that these failures are expected.