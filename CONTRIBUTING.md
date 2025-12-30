# Contributing to OTel Config Playground

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 10.4.1+
- Docker (for building container images)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/akria18/otel-config-playground.git
cd otel-config-playground

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and changelog generation.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `docs` | Documentation only | None |
| `style` | Code style (formatting) | None |
| `refactor` | Code refactoring | None |
| `perf` | Performance improvement | Patch |
| `test` | Adding/updating tests | None |
| `build` | Build system changes | None |
| `ci` | CI/CD changes | None |
| `chore` | Other changes | None |

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```
feat!: remove deprecated API endpoints

BREAKING CHANGE: The /api/v1 endpoints have been removed. Use /api/v2 instead.
```

### Examples

```bash
# Feature
git commit -m "feat: add YAML autocomplete for component names"

# Bug fix
git commit -m "fix: resolve duplicate React key warning in pipeline visualization"

# Documentation
git commit -m "docs: update Kubernetes deployment instructions"

# Breaking change
git commit -m "feat!: change validation API response format"
```

## Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) for automated releases.

### How It Works

1. **Merge to main**: When you merge a PR to `main`, Release Please analyzes the commits
2. **Release PR**: It creates/updates a Release PR with changelog and version bump
3. **Merge Release PR**: When you merge the Release PR, it:
   - Creates a GitHub Release with release notes
   - Tags the commit with the version
   - Builds and pushes Docker images to GHCR

### Manual Release (if needed)

```bash
# Create a release tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

This triggers the release workflow which:
- Builds multi-arch Docker images (amd64/arm64)
- Pushes to GitHub Container Registry
- Creates a GitHub Release with auto-generated notes

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the commit convention
3. Ensure all tests pass: `pnpm test`
4. Ensure type checking passes: `pnpm check`
5. Submit a PR with a clear description

### PR Title Convention

PR titles should also follow the conventional commit format, as they're used for the squash commit message:

```
feat: add dark mode toggle
fix: correct pipeline edge rendering
docs: add API documentation
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by Prettier)
- Run `pnpm format` before committing

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

## Docker

```bash
# Build locally
docker build -t otel-config-playground .

# Run locally
docker run -p 3000:3000 otel-config-playground
```

## Questions?

If you have questions, please open an issue on GitHub.