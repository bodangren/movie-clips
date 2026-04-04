# Track Specification: Configuration & State Management

## Overview
Implement a robust configuration system with schema validation, persistence, and React state management for the movie clips application. This track establishes how settings are stored, validated, and accessed throughout the application.

## Goals
1. Configuration schema definition using Zod for type-safe validation
2. Persistent storage of application settings using Tauri's store API
3. React state management with Zustand for global application state
4. Configuration UI for viewing and editing settings
5. Environment-aware configuration with development/production defaults

## Acceptance Criteria
### Functional Requirements
- [ ] Configuration schema defined for all application settings (paths, API keys, video settings)
- [ ] Settings persist between application sessions (Tauri store or JSON file)
- [ ] Configuration can be loaded, validated, and saved with proper error handling
- [ ] React components can access configuration via Zustand store
- [ ] Configuration UI allows viewing and editing of all settings
- [ ] Environment detection (development/production) with appropriate defaults
- [ ] Configuration validation provides clear error messages for invalid settings

### Non-Functional Requirements
- [ ] Configuration loading time < 100ms on average hardware
- [ ] Configuration schema extensible for future settings
- [ ] State updates trigger UI re-renders efficiently
- [ ] Configuration changes persist immediately or with explicit save
- [ ] Backup/restore mechanism for configuration

### Quality Requirements
- [ ] TypeScript types generated from Zod schema for full type safety
- [ ] Configuration validation covers all edge cases (empty strings, invalid paths, etc.)
- [ ] Error handling for corrupted or missing configuration
- [ ] Configuration migration support for future schema changes
- [ ] Comprehensive tests for configuration loading, validation, and persistence

## Technical Decisions
### Configuration Schema
- **Validation:** Zod for runtime validation and TypeScript type generation
- **Structure:** Hierarchical schema matching application domains (paths, google, video, pipeline)
- **Defaults:** Sensible defaults for all settings with environment overrides
- **Persistence:** Tauri store API for secure, platform-appropriate storage

### State Management
- **Library:** Zustand for lightweight, unopinionated state management
- **Structure:** Separate stores for configuration, UI state, and pipeline state
- **Persistence:** Selective persistence of certain state (config always, UI state optionally)
- **Middleware:** DevTools integration for debugging

### UI Approach
- **Form Library:** React Hook Form with Zod integration for validation
- **Layout:** Tabbed or categorized settings interface
- **Validation:** Real-time validation with clear error messages
- **Actions:** Save, reset, import/export configuration

## Configuration Schema Outline
```typescript
// Expected structure
{
  paths: {
    movies: string,      // Path to movie library
    tv: string,          // Path to TV library  
    output: string,      // Output directory
    temp: string,        // Temporary directory
  },
  google: {
    apiKey?: string,     // Optional API key
    projectId?: string,  // Optional project ID for Vertex
    location: string,    // Default: 'global'
    ttsVoices: string[], // Available TTS voices
  },
  video: {
    targetWidth: number, // Default: 720
    targetHeight: number, // Default: 1280 (9:16)
    fps: number,         // Default: 30
  },
  pipeline: {
    maxRetries: number,  // Default: 3
    timeoutMs: number,   // Default: 300000 (5 minutes)
  },
  ui: {
    theme: 'light' | 'dark' | 'system',
    language: string,    // Default: 'en'
  }
}
```

## Dependencies
- **External:** Zod, Zustand, React Hook Form, Tauri store API
- **Internal:** Track 1 (Foundation & Setup) must be completed

## Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Tauri store API limitations | Low | Medium | Fallback to JSON file storage |
| Zod schema complexity | Medium | Low | Start simple, extend gradually |
| State management performance | Low | Medium | Use selective updates, memoization |
| Configuration migration complexity | Medium | Medium | Implement versioned schema with migration functions |

## Success Metrics
- Configuration load time < 100ms
- State updates propagate to UI within 50ms
- Configuration validation covers 100% of schema fields
- Zero configuration corruption in stress tests
- Configuration UI intuitive for first-time users

## Out of Scope
- Video processing configuration (Track 3 will extend schema)
- AI/LLM specific configuration (Track 4 will extend schema)
- Advanced pipeline configuration (Track 6 will extend schema)
- User authentication/per-user configuration

## References
- [Zod Documentation](https://zod.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Hook Form](https://react-hook-form.com/)
- [Tauri Store API](https://tauri.app/plugin/store/)