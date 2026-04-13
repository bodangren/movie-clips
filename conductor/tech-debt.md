# Tech Debt

## Known Issues
1. **Tailwind CSS v4 warnings**: LightningCSS minifier shows `@theme` and `@tailwind` warnings (non-blocking, upstream issue)
2. **No Bun runtime**: Using npm fallback due to network restrictions (bun.sh unreachable)
3. **Missing `@tailwindcss/vite` plugin**: Tailwind v4 works via `@import` but Vite plugin not installed
4. **Disk space low**: ~5.8GB available; monitor during builds

## Planned Improvements
- Configuration UI components (Phase 4-5 of config track)
- Add Prettier (ESLint already configured - Phase 5)
- Production build size analysis (Phase 6)
- Tauri commands for AI operations (Phase 4 of AI/LLM Integration)

## Review Findings (2026-04-10)
13. **NFO parser regex issue**: Original regex `</${tag}>` didn't close properly. Fixed with `</${tag}>` (escaped slash).
14. **Vitest fs/promises mocking**: `vi.mock` hoists factory; using `vi.mocked(readFile).mockResolvedValue()` after dynamic import works.
15. **Library Scanner track complete**: Created types, NFO parser, subtitle parser, scanner, service. 96 tests pass.

## Review Findings (2026-04-11)
16. **Pipeline Orchestration track complete**: Created pipeline types, orchestrator with error recovery, 5 stages (select, analyze, generate, process, assemble), checkpoint manager, and history tracking. 127 tests pass.
17. **Core UI Components track complete**: Created full design system with 162 tests across 6 phases. Components: Button, Card, Input, Select, Textarea, Modal, Skeleton, Sidebar, MainLayout, PageHeader, MediaCard, MediaGrid, FilterBar, StatusIndicator, ProgressBar, LogViewer, PipelineMonitor, ConfigSection, ConfigForm, ThemeProvider, ErrorBoundary.
18. **Pre-existing test failures**: subtitle-parser.test.ts and nfo-parser.test.ts have 5 failing tests - these are unrelated to UI Components track and existed before this work.

## Review Findings (2026-04-12)
19. **Testing & Quality track started**: Added ESLint with TypeScript-ESLint, configured rules for React/Vite project, fixed linting errors in source files. 287 tests pass, 5 pre-existing failures in subtitle-parser/nfo-parser.
20. **ESLint config patterns**: Use `argsIgnorePattern: "^_"` to allow underscore-prefixed unused function parameters; test files get `no-explicit-any: off` since they often use `any` for mocks.

## Review Findings (2026-04-14)
21. **Uncommitted work in progress**: App integration work (App.tsx, Sidebar, SettingsPanel, library store, chroma wrapper, index.css redesign) is uncommitted. 13 modified files, 6 new files.
22. **Broken pipeline/index.ts export**: `createAssembleVideoStage` referenced deleted `./stages/assemble-video` module (leftover from Revideo migration refactor). Fixed to use `createRenderVideoStage` from `./stages/render-video`.
23. **Missing `id` in SubtitleEntry type**: `subtitle-parser.ts` sets `entry.id` but `SubtitleEntry` interface lacked the field. Fixed type and test.
24. **SettingsPanel zodResolver type mismatch**: `zodResolver(configSchema)` produces incompatible resolver types with `react-hook-form` `useForm<AppConfig>`. Root cause: Zod v4 schema inference differs from `@hookform/resolvers` expectations. Needs `@hookform/resolvers` update or type cast workaround.
25. **Pre-existing test failures persist**: 5 tests in `subtitle-parser.test.ts` (3) and `nfo-parser.test.ts` (2) still fail. Root cause: `vi.mock('fs/promises')` with async factory + dynamic `await import()` inside tests produces stale mock references. Mock pattern needs rework (use `vi.fn()` at top level instead of `importOriginal`).
26. **Debug artifacts in repo**: `main.js` (Vite compiled output) and `test-jsdom.ts` (debug utility) found in repo root. Added to `.gitignore`.
27. **chroma-js type declaration**: Added declaration file for `chroma-js` (transitive dependency from `@revideo/core`) to fix TS7016. Wrapper module re-exports all chroma-js functions via Vite alias.
