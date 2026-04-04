# Track Plan: Configuration & State Management

## Status Notes
- **Created:** 2025-04-03
- **Priority:** High
- **Estimated Duration:** 2 days
- **Dependencies:** foundation_20250403

## Phase 1: Configuration Schema & Types
- [ ] Task: Install required dependencies
    - [ ] Sub-task: Install Zod via Bun: `bun add zod`
    - [ ] Sub-task: Install Zustand via Bun: `bun add zustand`
    - [ ] Sub-task: Install React Hook Form via Bun: `bun add react-hook-form`
    - [ ] Sub-task: Install @hookform/resolvers for Zod: `bun add @hookform/resolvers`
- [ ] Task: Define configuration schema with Zod
    - [ ] Sub-task: Create `src/lib/config/schema.ts` with Zod schema
    - [ ] Sub-task: Define paths configuration (movies, tv, output, temp)
    - [ ] Sub-task: Define google configuration (apiKey, projectId, location, ttsVoices)
    - [ ] Sub-task: Define video configuration (targetWidth, targetHeight, fps)
    - [ ] Sub-task: Define pipeline configuration (maxRetries, timeoutMs)
    - [ ] Sub-task: Define UI configuration (theme, language)
    - [ ] Sub-task: Export TypeScript types from schema
- [ ] Task: Create configuration defaults
    - [ ] Sub-task: Create `src/lib/config/defaults.ts` with default values
    - [ ] Sub-task: Implement environment detection (dev vs prod)
    - [ ] Sub-task: Add environment-specific overrides
    - [ ] Sub-task: Create validation functions for paths (check if directories exist)

## Phase 2: Configuration Persistence
- [ ] Task: Set up Tauri store for configuration
    - [ ] Sub-task: Install Tauri store plugin if needed
    - [ ] Sub-task: Create `src-tauri/src/commands/config.rs` for config commands
    - [ ] Sub-task: Implement `get_config` command to load from store
    - [ ] Sub-task: Implement `save_config` command to persist to store
    - [ ] Sub-task: Implement `reset_config` command to restore defaults
- [ ] Task: Create configuration service layer
    - [ ] Sub-task: Create `src/lib/config/service.ts` with configuration API
    - [ ] Sub-task: Implement `loadConfig()` that calls Tauri command
    - [ ] Sub-task: Implement `saveConfig(config)` with validation
    - [ ] Sub-task: Implement `validateConfig(config)` with Zod
    - [ ] Sub-task: Add error handling for corrupted/missing config
- [ ] Task: Implement configuration migration
    - [ ] Sub-task: Add version field to configuration schema
    - [ ] Sub-task: Create migration functions for schema versions
    - [ ] Sub-task: Implement migration on config load
    - [ ] Sub-task: Test migration with sample old configs

## Phase 3: State Management with Zustand
- [ ] Task: Create configuration store
    - [ ] Sub-task: Create `src/stores/config.store.ts` with Zustand
    - [ ] Sub-task: Define store state (config, loading, error)
    - [ ] Sub-task: Implement actions (load, save, reset, update)
    - [ ] Sub-task: Add persistence middleware to sync with Tauri store
    - [ ] Sub-task: Add devtools integration for debugging
- [ ] Task: Create UI state store
    - [ ] Sub-task: Create `src/stores/ui.store.ts` for UI state
    - [ ] Sub-task: Define UI state (sidebar open, current page, theme)
    - [ ] Sub-task: Implement actions for UI interactions
    - [ ] Sub-task: Add optional persistence for UI preferences
- [ ] Task: Create pipeline state store (basic)
    - [ ] Sub-task: Create `src/stores/pipeline.store.ts` for pipeline state
    - [ ] Sub-task: Define basic pipeline state (status, progress, errors)
    - [ ] Sub-task: Implement actions for pipeline control (will be extended in Track 6)

## Phase 4: Configuration UI
- [ ] Task: Create configuration page layout
    - [ ] Sub-task: Create `src/pages/SettingsPage.tsx` component
    - [ ] Sub-task: Implement tabbed navigation for config categories
    - [ ] Sub-task: Add breadcrumb or navigation to settings page
    - [ ] Sub-task: Style settings page with Tailwind CSS
- [ ] Task: Implement paths configuration form
    - [ ] Sub-task: Create `src/components/settings/PathsSettings.tsx`
    - [ ] Sub-task: Add form fields for movies, tv, output, temp paths
    - [ ] Sub-task: Implement directory picker or path validation
    - [ ] Sub-task: Add "Browse" button that uses Tauri dialog API
- [ ] Task: Implement Google configuration form
    - [ ] Sub-task: Create `src/components/settings/GoogleSettings.tsx`
    - [ ] Sub-task: Add API key field with secure input (password type)
    - [ ] Sub-task: Add project ID and location fields
    - [ ] Sub-task: Add TTS voices selector (multi-select or dropdown)
- [ ] Task: Implement video configuration form
    - [ ] Sub-task: Create `src/components/settings/VideoSettings.tsx`
    - [ ] Sub-task: Add resolution fields (width, height) with aspect ratio validation
    - [ ] Sub-task: Add FPS selector with common options (24, 30, 60)
    - [ ] Sub-task: Add preview of video dimensions

## Phase 5: Form Validation & UX
- [ ] Task: Integrate React Hook Form with Zod validation
    - [ ] Sub-task: Set up form context with `useForm` and Zod resolver
    - [ ] Sub-task: Connect form to Zustand config store
    - [ ] Sub-task: Implement real-time validation feedback
    - [ ] Sub-task: Add form submission with loading states
- [ ] Task: Implement configuration actions UI
    - [ ] Sub-task: Add Save button that calls config store save action
    - [ ] Sub-task: Add Reset button to restore defaults
    - [ ] Sub-task: Add Export/Import configuration buttons
    - [ ] Sub-task: Add configuration status indicator (saved/unsaved)
- [ ] Task: Add configuration diagnostics
    - [ ] Sub-task: Create configuration validation summary
    - [ ] Sub-task: Add path existence checks with visual indicators
    - [ ] Sub-task: Add API key validation (test connection if possible)
    - [ ] Sub-task: Create configuration health check component

## Phase 6: Testing & Quality Gates
- [ ] Task: Write unit tests for configuration schema
    - [ ] Sub-task: Test Zod schema validation with valid/invalid data
    - [ ] Sub-task: Test configuration defaults generation
    - [ ] Sub-task: Test migration functions
    - [ ] Sub-task: Test configuration service methods
- [ ] Task: Write unit tests for Zustand stores
    - [ ] Sub-task: Test config store actions (load, save, reset)
    - [ ] Sub-task: Test UI store actions
    - [ ] Sub-task: Test store persistence behavior
- [ ] Task: Write component tests for configuration UI
    - [ ] Sub-task: Test SettingsPage renders correctly
    - [ ] Sub-task: Test form validation displays errors
    - [ ] Sub-task: Test form submission updates store
- [ ] Task: Conductor - User Manual Verification 'Configuration & State Management'
    - [ ] Sub-task: Developer can open settings page
    - [ ] Sub-task: Developer can modify and save configuration
    - [ ] Sub-task: Configuration persists between app restarts
    - [ ] Sub-task: Form validation provides helpful error messages
    - [ ] Sub-task: Configuration can be reset to defaults

## Success Checklist
- [ ] Configuration schema validates all required fields
- [ ] Settings persist between application sessions
- [ ] Zustand stores update UI components efficiently
- [ ] Configuration UI is intuitive and responsive
- [ ] Form validation provides clear error messages
- [ ] Configuration can be exported/imported
- [ ] All tests pass for configuration logic
- [ ] Configuration load time < 100ms
- [ ] No TypeScript errors in configuration code

## Notes
- Keep configuration schema extensible for future tracks
- Focus on user experience for configuration management
- Ensure sensitive data (API keys) are handled securely
- Consider localization for configuration labels (future enhancement)
- Document configuration options and their effects