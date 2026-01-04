# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1](https://github.com/akria18/opentelemetry-playground/compare/opentelemetry-playground-v1.2.0...opentelemetry-playground-v1.2.1) (2026-01-04)


### Documentation

* add new ideas ([c59496d](https://github.com/akria18/opentelemetry-playground/commit/c59496de90353307fb10959c4125468622689b36))

## [1.2.0](https://github.com/akria18/opentelemetry-playground/compare/opentelemetry-playground-v1.1.0...opentelemetry-playground-v1.2.0) (2025-12-30)


### Features

* add the ability to use otelcol binary and fallback mecanism ([c75eaf5](https://github.com/akria18/opentelemetry-playground/commit/c75eaf5b8a1398343a7ea3acc1291cb0ee8a0796))
* cleanup and add ignores ([c53de97](https://github.com/akria18/opentelemetry-playground/commit/c53de97089056a2507c2e1180bc62080497c9c90))
* improve ci and push new version ([1e5ea6d](https://github.com/akria18/opentelemetry-playground/commit/1e5ea6d500f544575604ae2bfbe275faba3532c9))
* Initial implementation of OTel Config Playground ([76146ff](https://github.com/akria18/opentelemetry-playground/commit/76146ffa27395e59c4b28c25c6a81325190e207f))


### Documentation

* add next steps to add to Otel Playground ([2d804e6](https://github.com/akria18/opentelemetry-playground/commit/2d804e6c53d6cc1ddec9b2e4dde05be2dc6dbbb0))
* add otel config playground image ([9041c97](https://github.com/akria18/opentelemetry-playground/commit/9041c97f0fb135488e8427693ea26aad4593de2e))
* fix wrong version ([77fef58](https://github.com/akria18/opentelemetry-playground/commit/77fef58eef28d91c04c39be71d06193774bdc3cc))
* fix wrong version ([f229181](https://github.com/akria18/opentelemetry-playground/commit/f229181c17842743d2826bc49069e5ba788c0a50))

## [1.1.0](https://github.com/akria18/opentelemetry-playground/compare/otel-config-playground-v1.0.0...otel-config-playground-v1.1.0) (2025-12-30)


### Features

* add the ability to use otelcol binary and fallback mecanism ([c75eaf5](https://github.com/akria18/opentelemetry-playground/commit/c75eaf5b8a1398343a7ea3acc1291cb0ee8a0796))
* cleanup and add ignores ([c53de97](https://github.com/akria18/opentelemetry-playground/commit/c53de97089056a2507c2e1180bc62080497c9c90))
* Initial implementation of OTel Config Playground ([76146ff](https://github.com/akria18/opentelemetry-playground/commit/76146ffa27395e59c4b28c25c6a81325190e207f))


### Documentation

* add next steps to add to Otel Playground ([2d804e6](https://github.com/akria18/opentelemetry-playground/commit/2d804e6c53d6cc1ddec9b2e4dde05be2dc6dbbb0))
* add otel config playground image ([9041c97](https://github.com/akria18/opentelemetry-playground/commit/9041c97f0fb135488e8427693ea26aad4593de2e))
* fix wrong version ([77fef58](https://github.com/akria18/opentelemetry-playground/commit/77fef58eef28d91c04c39be71d06193774bdc3cc))
* fix wrong version ([f229181](https://github.com/akria18/opentelemetry-playground/commit/f229181c17842743d2826bc49069e5ba788c0a50))

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
