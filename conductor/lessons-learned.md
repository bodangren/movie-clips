# Lessons Learned

## 2026-04-05
- **Bun installation**: `bun.sh` may be unreachable in restricted networks; use `npm install -g bun` as fallback
- **Tailwind v4**: Uses `@import "tailwindcss"` instead of config files; no `tailwind.config.js` needed
- **TypeScript + Tauri**: `tsconfig.node.json` needed for vite.config.ts to avoid module resolution conflicts
- **React 19 types**: Event handlers need explicit `FormEvent`/`ChangeEvent` imports in strict mode
- **Zod v4 nested defaults**: When parent object is missing, nested `.default()` values don't apply. Use `z.preprocess((val) => val ?? {}, schema).default(defaults)` pattern to ensure defaults propagate through partial input.
- **Tauri store plugin**: `app.store()` returns `Arc<Store>`, not `()`. Methods are `store.set()`, `store.get()`, `store.save()`. No need for `State` management — use `AppHandle` in commands.
- **Zustand testing**: Use `store.setState()` to reset state between tests. Mock service imports with `vi.mock()` for store tests.
