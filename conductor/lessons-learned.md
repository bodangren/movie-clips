# Lessons Learned

## 2026-04-09
- **AI SDK imports**: Use named exports directly; `generateObject` from 'ai', `createVertex` from '@ai-sdk/google-vertex', `GoogleGenAI` from '@google/genai'
- **Bun unavailable**: When bun is not available, fall back to npm; the project will still work correctly
- **Config singleton**: Use module-level cached config with sync getter alongside async loadConfig for reactive UI updates
- **TypeScript .js extensions**: Don't use .js extensions in imports when using TypeScript's default module resolution

## 2026-04-08
- **Rust dead_code warnings**: Use `#[allow(dead_code)]` on methods/variants kept for future API extensibility, not just to suppress warnings but to document intent.
- **Cross-platform FFmpeg detection**: Use `which` crate instead of Unix `which` command for cross-platform compatibility.

## 2026-04-05
- **Bun installation**: `bun.sh` may be unreachable in restricted networks; use `npm install -g bun` as fallback
- **Tailwind v4**: Uses `@import "tailwindcss"` instead of config files; no `tailwind.config.js` needed
- **TypeScript + Tauri**: `tsconfig.node.json` needed for vite.config.ts to avoid module resolution conflicts
- **React 19 types**: Event handlers need explicit `FormEvent`/`ChangeEvent` imports in strict mode
- **Zod v4 nested defaults**: When parent object is missing, nested `.default()` values don't apply. Use `z.preprocess((val) => val ?? {}, schema).default(defaults)` pattern to ensure defaults propagate through partial input.
- **Tauri store plugin**: `app.store()` returns `Arc<Store>`, not `()`. Methods are `store.set()`, `store.get()`, `store.save()`. No need for `State` management — use `AppHandle` in commands.
- **Zustand testing**: Use `store.setState()` to reset state between tests. Mock service imports with `vi.mock()` for store tests.
