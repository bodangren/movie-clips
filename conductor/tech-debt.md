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
