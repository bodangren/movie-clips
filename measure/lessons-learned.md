# Lessons Learned

## Recurring Gotchas

- **Vitest fs/promises mock pattern**: Use `vi.mock('fs/promises', () => { const mock = vi.fn(); return { default: { readFile: mock }, readFile: mock }; })` — not async factory + dynamic import (produces stale references).
- **Tauri invoke needs __TAURI_INTERNALS__**: In Tauri 2.x, `window.__TAURI_INTERNALS__` must be present. If using Vite dev server without Tauri, invoke fails silently. Always check before calling.
- **Tailwind v4 requires @tailwindcss/vite**: Without the plugin, utility classes are not generated. Only theme layer and base CSS load.
- **Zod v4 + @hookform/resolvers incompatibility**: `zodResolver(schema)` produces incompatible types. Workaround: type cast or pin resolver version.
- **Pipeline stages use Node.js fs**: Cannot run in browser. Must execute through Tauri commands that spawn Bun processes.
- **Relative paths break in Tauri**: Default config used `./Movies` which resolves against Tauri's CWD, not project root. Use absolute paths.
- **Config store race condition**: `loadConfig()` is async in useEffect. If scan runs before config loads, it uses defaults. Ensure config is loaded before dependent operations.
- **ESLint 10 compatibility**: eslint-plugin-react/jsx-a11y have issues with ESLint 10's new API. Use simplified config without React plugins.
- **Tauri store plugin**: `app.store()` returns `Arc<Store>`. Methods are `store.set()`, `store.get()`, `store.save()`. Use `AppHandle` in commands, not `State`.
- **chroma-js type declaration needed**: Library exports `Color` at runtime but TypeScript types don't declare it. Use `@ts-expect-error` when runtime behavior is correct.

## Key Decisions

- **Revideo over raw FFmpeg**: Revideo composition replaces complex FFmpeg command chains. Better maintainability.
- **Gemini TTS over Google Cloud TTS**: Using `gemini-2.5-flash-lite-preview-tts` via `@google/genai` (not `@google-cloud/text-to-speech`).
- **AI SDK for LLM**: Using Vercel AI SDK `generateObject` with `@ai-sdk/google-vertex`. Vertex API key auth NOT supported — uses project/location + ADC.
- **SQLite for analytics**: Using `tauri-plugin-sql` with SQLite for local analytics storage.

## Planning Insights

- **Don't add features while core is broken**: YouTube upload, GPU encoding, analytics were built while library scan and pipeline didn't work.
- **Tests passing ≠ feature working**: Unit tests on mocks prove code structure, not functionality. Must verify in real browser.
- **Manual verification is not optional**: Every track marked complete should have been verified end-to-end. "Manual verification pending" means "not done."
- **Bounded memory files must be enforced**: tech-debt.md and lessons-learned.md at 190+ lines are useless. Prune aggressively.
