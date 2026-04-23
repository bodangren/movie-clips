# Track Plan: Configuration & State Management

## Status Notes
- **Created:** 2025-04-03
- **Completed:** 2026-04-05
- **Priority:** High
- **Estimated Duration:** 2 days
- **Dependencies:** foundation_20250403

## Phase 1: Configuration Schema & Types
- [x] Task: Install required dependencies
    - [x] Sub-task: Install Zod via Bun: `bun add zod`
    - [x] Sub-task: Install Zustand via Bun: `bun add zustand`
    - [x] Sub-task: Install React Hook Form via Bun: `bun add react-hook-form`
    - [x] Sub-task: Install @hookform/resolvers for Zod: `bun add @hookform/resolvers`
- [x] Task: Define configuration schema with Zod
    - [x] Sub-task: Create `src/lib/config/schema.ts` with Zod schema
    - [x] Sub-task: Define paths configuration (movies, tv, output, temp)
    - [x] Sub-task: Define google configuration (apiKey, projectId, location, ttsVoices)
    - [x] Sub-task: Define video configuration (targetWidth, targetHeight, fps)
    - [x] Sub-task: Define pipeline configuration (maxRetries, timeoutMs)
    - [x] Sub-task: Define UI configuration (theme, language)
    - [x] Sub-task: Export TypeScript types from schema
- [x] Task: Create configuration defaults
    - [x] Sub-task: Create `src/lib/config/defaults.ts` with default values
    - [x] Sub-task: Implement environment detection (dev vs prod)
    - [x] Sub-task: Add environment-specific overrides

## Phase 2: Configuration Persistence
- [x] Task: Set up Tauri store for configuration
    - [x] Sub-task: Install Tauri store plugin (tauri-plugin-store v2.4.2)
    - [x] Sub-task: Create `src-tauri/src/commands/config.rs` for config commands
    - [x] Sub-task: Implement `get_config` command to load from store
    - [x] Sub-task: Implement `save_config` command to persist to store
    - [x] Sub-task: Implement `reset_config` command to restore defaults
- [x] Task: Create configuration service layer
    - [x] Sub-task: Create `src/lib/config/service.ts` with configuration API
    - [x] Sub-task: Implement `loadConfig()` that calls Tauri command
    - [x] Sub-task: Implement `saveConfig(config)` with validation
    - [x] Sub-task: Implement `validateConfig(config)` with Zod
    - [x] Sub-task: Add error handling for corrupted/missing config

## Phase 3: State Management with Zustand
- [x] Task: Create configuration store
    - [x] Sub-task: Create `src/stores/config.store.ts` with Zustand
    - [x] Sub-task: Define store state (config, loading, error, unsavedChanges)
    - [x] Sub-task: Implement actions (load, save, reset, update)
- [x] Task: Create UI state store
    - [x] Sub-task: Create `src/stores/ui.store.ts` for UI state
    - [x] Sub-task: Define UI state (sidebar open, current page, theme, settingsTab)
    - [x] Sub-task: Implement actions for UI interactions
- [x] Task: Create pipeline state store (basic)
    - [x] Sub-task: Create `src/stores/pipeline.store.ts` for pipeline state
    - [x] Sub-task: Define basic pipeline state (status, progress, currentStep, errors)
    - [x] Sub-task: Implement actions for pipeline control

## Phase 4: Configuration UI
- [ ] Task: Create configuration page layout
- [ ] Task: Implement paths configuration form
- [ ] Task: Implement Google configuration form
- [ ] Task: Implement video configuration form

## Phase 5: Form Validation & UX
- [ ] Task: Integrate React Hook Form with Zod validation
- [ ] Task: Implement configuration actions UI
- [ ] Task: Add configuration diagnostics

## Phase 6: Testing & Quality Gates
- [x] Task: Write unit tests for configuration schema
- [x] Task: Write unit tests for Zustand stores
- [ ] Task: Write component tests for configuration UI

## Success Checklist
- [x] Configuration schema validates all required fields
- [x] Settings persist between application sessions (Tauri store)
- [x] Zustand stores update UI components efficiently
- [ ] Configuration UI is intuitive and responsive
- [ ] Form validation provides clear error messages
- [ ] Configuration can be exported/imported
- [x] All tests pass for configuration logic (55 tests)
- [x] No TypeScript errors in configuration code
- [x] Rust code passes clippy linting

## Notes
- Zod v4 requires `.preprocess()` pattern for nested object defaults when parent is missing
- Tauri store plugin uses `StoreExt` trait with `app.store()` method
- All stores use Zustand with explicit state reset in tests for isolation
