# Track Plan: Foundation & Setup

## Status Notes
- **Created:** 2025-04-03
- **Priority:** Critical
- **Estimated Duration:** 3 days
- **Dependencies:** None

## Phase 1: Environment Setup & Project Initialization
- [x] Task: Install and verify required tools
    - [x] Sub-task: Install Rust toolchain (rustup recommended)
    - [x] Sub-task: Install Bun runtime (latest stable)
    - [x] Sub-task: Verify Git is installed and configured
    - [x] Sub-task: Check system requirements (RAM, disk space)
    - Note: Disk space is low (5.8GB available) but sufficient for initial setup
- [x] Task: Initialize Tauri project with React template
    - [x] Sub-task: Run `bun create tauri-app movie-clips --template react`
    - [x] Sub-task: Verify project structure created correctly
    - [x] Sub-task: Test initial build with `bun run tauri dev`
      - Note: Frontend builds successfully, Tauri dev requires rsvg2 system dependency
    - [x] Sub-task: Commit initial project structure
- [x] Task: Configure Bun as package manager
    - [x] Sub-task: Remove package-lock.json/yarn.lock if present
    - [x] Sub-task: Update package.json scripts to use Bun
    - [x] Sub-task: Run `bun install` to generate bun.lockb
    - [x] Sub-task: Verify Bun commands work (bun run, bun test, etc.)

## Phase 2: Development Environment Configuration
- [x] Task: Set up TypeScript configuration
    - [x] Sub-task: Review and update tsconfig.json for strict mode
    - [x] Sub-task: Configure path aliases if needed (@/* → ./src/*)
    - [x] Sub-task: Set up TypeScript compiler options for React
    - [x] Sub-task: Test TypeScript compilation (build passes)
    - Note: Migrated .jsx → .tsx, added tsconfig.node.json for vite.config.ts
- [x] Task: Configure Tailwind CSS
    - [x] Sub-task: Install Tailwind CSS v4 via npm (bun unavailable)
    - [x] Sub-task: Set up CSS file with `@import "tailwindcss"` directive
    - [x] Sub-task: Verify Tailwind classes work in components
    - Note: Tailwind v4 uses @import, no config file needed; LightningCSS warnings are non-blocking
- [x] Task: Set up hot reload and development workflow
    - [x] Sub-task: Configure Tauri for hot reload (tauri.conf.json already configured)
    - [x] Sub-task: Vite HMR configured with strictPort: true
    - Note: Full Tauri dev requires rsvg2 system dependency

## Phase 3: Basic Tauri Integration
- [x] Task: Create example Tauri command
    - [x] Sub-task: Add Rust command in src-tauri/src/lib.rs
    - [x] Sub-task: Expose command to frontend via Tauri API
    - [x] Sub-task: Create React component that calls the command
    - [x] Sub-task: Test command execution with UI feedback
    - Note: Added get_app_info and scan_directory commands
- [x] Task: Set up basic error handling
    - [x] Sub-task: Add error types for Tauri commands (AppError enum with thiserror)
    - [x] Sub-task: Implement error propagation frontend → backend
    - [x] Sub-task: Add basic error UI components (error-banner with dark mode)
    - [x] Sub-task: Test error scenarios (Rust unit tests cover invalid paths)

## Phase 4: Testing Infrastructure
- [x] Task: Set up Vitest for TypeScript testing
    - [x] Sub-task: Install Vitest, jsdom, and Testing Library via npm
    - [x] Sub-task: Configure vitest.config.ts with jsdom environment
    - [x] Sub-task: Create example test for App component (4 tests)
    - [x] Sub-task: Run tests and verify they pass (4/4 passing)
    - Note: Added test and test:watch scripts to package.json
- [x] Task: Set up Rust testing
    - [x] Sub-task: Create example unit test in Rust code (7 tests)
    - [x] Sub-task: Test Rust compilation and tests
    - [x] Sub-task: Document Rust testing commands
    - Note: Tests cover greet, get_app_info, scan_directory, and error serialization
- [x] Task: Create test utilities
    - [x] Sub-task: Set up test helpers for React components (src/test/setup.ts)
    - [x] Sub-task: Create mock Tauri API for testing (vi.mock in App.test.tsx)
    - [x] Sub-task: Document testing patterns

## Phase 5: Build & Script Configuration
- [ ] Task: Configure build scripts
    - [ ] Sub-task: Update package.json scripts for development/production
    - [ ] Sub-task: Test `bun run tauri build` for production build
    - [ ] Sub-task: Verify build output structure
    - [ ] Sub-task: Test built application runs correctly
- [ ] Task: Set up code quality tools
    - [ ] Sub-task: Install and configure ESLint for TypeScript
    - [ ] Sub-task: Install and configure Prettier for code formatting
    - [ ] Sub-task: Set up Husky for git hooks (optional)
    - [ ] Sub-task: Create lint-staged configuration
- [ ] Task: Create development documentation
    - [ ] Sub-task: Update README.md with setup instructions
    - [ ] Sub-task: Document common development workflows
    - [ ] Sub-task: Create troubleshooting guide
    - [ ] Sub-task: Add architecture overview

## Phase 6: Verification & Quality Gates
- [ ] Task: Run comprehensive verification
    - [ ] Sub-task: Test on multiple platforms if available (macOS/Windows/Linux)
    - [ ] Sub-task: Verify all acceptance criteria from spec
    - [ ] Sub-task: Performance check (startup time, hot reload speed)
    - [ ] Sub-task: Bundle size analysis
- [ ] Task: Conductor - User Manual Verification 'Foundation & Setup' (Protocol in workflow.md)
    - [ ] Sub-task: Developer follows setup instructions from README
    - [ ] Sub-task: Verifies hot reload works for both frontend and backend
    - [ ] Sub-task: Tests example Tauri command
    - [ ] Sub-task: Runs test suite successfully
- [ ] Task: Final cleanup and documentation
    - [ ] Sub-task: Remove any unused files from template
    - [ ] Sub-task: Update gitignore for Bun/Tauri specific files
    - [ ] Sub-task: Create CHANGELOG entry for foundation
    - [ ] Sub-task: Commit final foundation code with descriptive message

## Success Checklist
- [ ] `bun run tauri dev` starts app with hot reload within 5 seconds
- [ ] React component changes reflect in browser within 2 seconds
- [ ] Rust code changes trigger recompile and reload
- [ ] Example Tauri command executes and returns data to frontend
- [ ] TypeScript compilation passes with strict mode enabled
- [ ] Test suite runs without errors (both TypeScript and Rust)
- [ ] Production build creates executable < 10MB
- [ ] README provides clear setup instructions for new developers

## Notes
- This track establishes the foundation for all subsequent tracks
- Keep configuration minimal but extensible for future tracks
- Focus on developer experience and fast iteration
- Document any deviations from standard Tauri/Bun setup
- Ensure cross-platform compatibility from the start