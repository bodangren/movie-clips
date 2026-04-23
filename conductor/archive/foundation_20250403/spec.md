# Track Specification: Foundation & Setup

## Overview
Initialize a Tauri project with Bun frontend for the movie clips application. Establish the development environment, project structure, and basic tooling to support the Bun+Tauri refactor.

## Goals
1. Working Tauri desktop application with Bun as the frontend package manager
2. Hot reload development environment for both Rust backend and React frontend
3. Basic project structure following Bun+Tauri best practices
4. Build, test, and development scripts configured
5. TypeScript compilation and Rust compilation working

## Acceptance Criteria
### Functional Requirements
- [ ] `bun run tauri dev` starts the application with hot reload enabled
- [ ] React UI renders basic components (App component with title)
- [ ] Tauri commands can be called from the frontend (demonstrate with simple example)
- [ ] TypeScript compilation works without errors
- [ ] Rust compilation works without errors
- [ ] Development server supports live reload for both frontend and backend changes

### Non-Functional Requirements
- [ ] Project structure follows Tauri + Bun conventions
- [ ] Dependencies are managed with Bun (bun.lockb present)
- [ ] Git repository initialized with appropriate .gitignore
- [ ] Development environment documented in README
- [ ] Basic error handling in place for setup failures

### Quality Requirements
- [ ] No TypeScript compilation errors in strict mode
- [ ] No Rust compilation warnings (or minimal, justified warnings)
- [ ] Code follows established style guides (TypeScript, Rust)
- [ ] Project can be built for development and production

## Technical Decisions
### Stack Choices
- **Frontend:** React 18 with TypeScript, Tailwind CSS for styling
- **Backend:** Tauri 2.x with Rust
- **Package Manager:** Bun 1.1+
- **Build Tool:** Tauri's built-in build system with Bun for frontend
- **Testing:** Vitest for TypeScript, Rust's built-in testing

### Architecture Decisions
1. Use `create-tauri-app` with React template as starting point
2. Replace npm/yarn with Bun for package management
3. Configure Tailwind CSS for consistent styling
4. Set up hot reload for both Rust and TypeScript changes
5. Establish monorepo-like structure within Tauri project

### Constraints
- Must work on macOS, Windows, and Linux
- Should not require global Node.js installation (Bun handles this)
- FFmpeg not required for this track (will be added in Track 3)
- AI/LLM integration not required for this track (will be added in Track 4)

## Dependencies
- **External:** Rust toolchain, Bun runtime, Git
- **Internal:** None (this is the foundational track)

## Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Tauri 2.x compatibility issues with Bun | Medium | High | Test with latest stable versions, have fallback to Node.js if needed |
| Cross-platform build issues | Low | Medium | Test on target platforms early, use Tauri's cross-platform tools |
| Bun package compatibility | Low | Medium | Verify critical packages work with Bun, keep Node.js as backup |
| Development environment complexity | Medium | Low | Document setup thoroughly, provide setup scripts |

## Success Metrics
- Development environment setup time < 15 minutes for new developers
- Hot reload latency < 2 seconds for frontend changes
- Initial build time < 30 seconds
- Application bundle size < 10MB (empty app)
- Zero critical bugs in foundation code

## Out of Scope
- Video processing functionality (Track 3)
- AI/LLM integration (Track 4)
- Configuration management (Track 2)
- UI components beyond basic skeleton (Track 7)
- Production deployment (Track 10)

## References
- [Tauri Documentation](https://tauri.app/)
- [Bun Documentation](https://bun.sh/docs)
- [create-tauri-app](https://tauri.app/start/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)