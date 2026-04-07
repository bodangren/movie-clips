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

## Review Findings (2026-04-07)
5. **`unified_service.inner()` returns `&self`**: No-op identity method with misleading name. Remove or rename.
6. **`MetricsCollector.last_operations` always empty**: Only tracks counters, not individual ops. Needs ring-buffer for actual operation history.
7. **`health_check.rs` uses Unix `which`**: Won't work on Windows — use `which::which()` crate or conditional compilation.
8. **4 Rust dead_code warnings**: `with_progress_callback`, `with_delay`, `with_errors`, `reload_config`, `metrics`, `config`, `inner`, `Timeout`, `Internal` — all public API for future use. Suppress with `#[allow(dead_code)]` at module level or gate behind feature flags.
