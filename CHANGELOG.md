# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-30

### Features

- Initial release of OTel Config Playground
- YAML editor with Monaco Editor and syntax highlighting
- Real-time pipeline visualization using React Flow
- Support for receivers, processors, exporters, extensions, and connectors
- OTel Collector binary validation (with fallback to structural validation)
- Config templates dropdown with preset configurations (Jaeger, Prometheus, OTLP, etc.)
- Component tooltips showing configuration details on hover
- Import/Export functionality for configurations
- Error console with clickable line navigation
- Kubernetes deployment manifests with HPA support
- Multi-architecture Docker image (amd64/arm64)

### Documentation

- Comprehensive README with usage instructions
- Kubernetes deployment guide
- Docker usage examples

---

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system changes |
| `ci` | CI/CD changes |
| `chore` | Other changes |

### Examples

```
feat: add YAML autocomplete for component names
fix: resolve duplicate React key warning in pipeline visualization
docs: update Kubernetes deployment instructions
```