# Tech Debt

## Known Issues
1. **Tailwind CSS v4 warnings**: LightningCSS minifier shows `@theme` and `@tailwind` warnings (non-blocking, upstream issue)
2. **No Bun runtime**: Using npm fallback due to network restrictions (bun.sh unreachable)
3. **Missing `@tailwindcss/vite` plugin**: Tailwind v4 works via `@import` but Vite plugin not installed
4. **Disk space low**: ~5.8GB available; monitor during builds

## Planned Improvements
- Configuration UI components (Phase 4-5 of config track)
- Add ESLint + Prettier (Phase 5)
- Production build size analysis (Phase 6)
- Tauri commands for AI operations (Phase 4 of AI/LLM Integration)

## Review Findings (2026-04-10)
13. **NFO parser regex issue**: Original regex `</${tag}>` didn't close properly. Fixed with `</${tag}>` (escaped slash).
14. **Vitest fs/promises mocking**: `vi.mock` hoists factory; using `vi.mocked(readFile).mockResolvedValue()` after dynamic import works.
15. **Library Scanner track complete**: Created types, NFO parser, subtitle parser, scanner, service. 96 tests pass.

## Review Findings (2026-04-11)
16. **Pipeline Orchestration track complete**: Created pipeline types, orchestrator with error recovery, 5 stages (select, analyze, generate, process, assemble), checkpoint manager, and history tracking. 127 tests pass.
