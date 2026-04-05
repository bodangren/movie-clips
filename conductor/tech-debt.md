# Tech Debt

## Known Issues
1. **Tailwind CSS v4 warnings**: LightningCSS minifier shows `@theme` and `@tailwind` warnings (non-blocking, upstream issue)
2. **No Bun runtime**: Using npm fallback due to network restrictions (bun.sh unreachable)
3. **Missing `@tailwindcss/vite` plugin**: Tailwind v4 works via `@import` but Vite plugin not installed
4. **Disk space low**: ~5.8GB available; monitor during builds

## Planned Improvements
- Add Vitest for TypeScript testing (Phase 4)
- Add Rust unit tests (Phase 4)
- Configure ESLint + Prettier (Phase 5)
- Production build size analysis (Phase 6)
