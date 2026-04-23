# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Application icons for all platforms
- Developer documentation (ARCHITECTURE.md, CONTRIBUTING.md)
- GitHub Actions release workflow
- Tauri updater configuration template

### Changed

- Window configuration: 1200x800 default, 800x600 minimum
- Bundle identifier: com.movieclips.app
- Product name: Movie Clips

## [0.1.0] - 2025-04-03

### Added

- Initial release with core features:
  - Media library scanner (NFO + subtitle parsing)
  - AI-powered content analysis (Gemini)
  - Text-to-speech generation
  - Video pipeline orchestration
  - Revideo-based video composition
  - React UI with dashboard, library, and pipeline monitor
  - Configuration management with Zod validation
  - Comprehensive test suite (300+ tests)
  - CI/CD with GitHub Actions

[Unreleased]: https://github.com/bodangren/movie-clips/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/bodangren/movie-clips/releases/tag/v0.1.0
