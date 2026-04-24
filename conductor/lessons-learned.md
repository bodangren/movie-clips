# Lessons Learned

## 2026-04-25 (GPU-Accelerated Video Encoding Phase 2)

- **Rust enum serialization with serde**: Use `#[serde(rename = "nvenc")]` on enum variants for clean JSON representation. `EncoderType` and `QualityPreset` enums serialize to lowercase strings.
- **FFmpeg encoder flag patterns**: Each encoder has distinct flag patterns - NVENC uses `-cq 23`, VAAPI uses `-qp 23`, VideoToolbox uses `-q:v 65`, software uses `-crf 23`. All require `-pix_fmt yuv420p` for compatibility.
- **Encoder selection priority**: Auto-selection should validate encoders before use. `ValidationStatus::Validated` means the encoder was tested with a 1-frame encode. Parse-only results should be conservative.
- **User preference with fallback**: Store user preference separately from actual selection. If preferred encoder is unavailable, fall back to auto-selection. Selection reason helps debugging.
- **Config schema evolution**: Adding fields to Zod schema requires updating TypeScript defaults, Rust config structs, and parser functions. Both sides must stay in sync.
- **Tauri command return types**: Commands can return custom structs that implement `Serialize`. Frontend receives the JSON representation directly.
- **Rust test assertions with CLI args**: FFmpeg flags include leading dashes (e.g., `-cq`, `-crf`). Tests must check for the exact string including the dash.

## 2026-04-24 (GPU-Accelerated Video Encoding Phase 1)

- **Rust `Vec<String>.contains()`**: Requires `&String` argument, not `&str`. Use `.contains(&"foo".to_string())` or `.iter().any(|s| s == "foo")`.
- **Rust ownership in struct construction**: When building a struct that uses a value both as a field and in a subsequent expression, clone it: `field: value.clone()`.
- **Tauri command for detection**: GPU detection belongs in Rust backend (shells to FFmpeg), exposed via `#[tauri::command]`, consumed by frontend through `invoke()`.
- **FFmpeg encoder validation**: A 1-frame encode to `null` output (`-f lavfi -i color=c=black:s=64x64:d=1 -c:v {encoder} -frames:v 1 -f null -`) is a fast way to verify an encoder works without writing files.
- **Encoder priority chain**: NVENC > VideoToolbox > VAAPI > libx264. This prioritizes speed while maintaining broad compatibility.

## 2026-04-24 (YouTube Auto-Publish Phase 2)

- **Fetch-based resumable uploads**: Using `fetch` instead of `XMLHttpRequest` for chunk uploads works better in test environments (jsdom) and modern browsers. Progress can be tracked at chunk granularity rather than byte granularity.
- **YouTube resumable upload protocol**: Initiate with `POST /upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, then `PUT` chunks to the returned `Location` URI with `Content-Range: bytes start-end/total` headers.
- **Exponential backoff in tests**: Tests with retry delays need extended timeouts (e.g., 15s) or fake timers. Base delay of 1s with 3 retries = 7s total sleep time.
- **AbortSignal with fetch mocks**: Mock implementations must attach `abort` event listeners to the signal and reject when triggered, otherwise cancellation tests hang indefinitely.
- **ESLint preserve-caught-error rule**: When re-throwing errors, always attach the original error as `{ cause: error }` to preserve stack traces and satisfy the linter.

## 2026-04-24 (YouTube Auto-Publish Phases 2-5)

- **Pipeline integration pattern**: Extract metadata generation into a separate module (`metadata.ts`) so it can be reused by both manual uploads and auto-queue. This avoids duplication between `pipeline-integration.ts` and `pipeline-youtube-integration.ts`.
- **Scheduler quota counting**: Count all scheduled items for the day (not just published/uploading) to prevent overscheduling. Use date string comparison (`toISOString().split('T')[0]`) for simple day-boundary checks.
- **Retry logic design**: Allow rescheduling when `retryCount < MAX_RETRIES`, not `<=`. This gives MAX_RETRIES total attempts (initial + retries). Test with 2 reschedules for a max of 3 attempts.
- **Fake timer compatibility**: `vi.setSystemTime` is not available in all Vitest versions. For time-dependent tests, either use simple Date mocking or test behavior without exact timestamp assertions.
- **Queue state persistence**: Design storage as an interface (`QueueStorage`) so it can be swapped between localStorage (web), Tauri store (desktop), or memory (tests).

## 2026-04-24 (YouTube Auto-Publish Phase 1)

- **Tauri store plugin for OAuth tokens**: Use separate store file (`youtube.json`) for sensitive tokens, not the main config. Rust commands `get_youtube_tokens`, `save_youtube_tokens`, `clear_youtube_tokens` wrap the store plugin.
- **OAuth2 token refresh pattern**: Store `expires_at` (Unix timestamp ms) and check against `Date.now() + buffer`. On expiry, call Google's token endpoint with `refresh_token` and `grant_type=refresh_token`.
- **Vitest `vi.mocked` availability**: Some pre-existing tests use `vi.mocked()` which may not be available in all vitest versions. New tests should use direct mock function references instead.
- **Config schema versioning**: Adding new sections (like `youtube`) to Zod config schema requires updating both TypeScript schema and Rust default config to prevent runtime errors.

## 2026-04-23 (Autonomous Polish & Deployment)

- **ImageMagick icon generation**: Use `convert -background none icon.svg -resize {size}x{size} output.png` to generate platform icons from SVG. Works for PNG, ICO, ICNS formats.
- **Tauri bundle metadata**: `category`, `copyright`, `publisher` fields go in `bundle` object in tauri.conf.json. `identifier` should be reverse-DNS format (com.movieclips.app).
- **GitHub Actions release workflow**: Use `tauri-apps/tauri-action` for cross-platform Tauri builds. Matrix strategy covers macOS (Intel + Apple Silicon), Ubuntu, Windows. Generate changelog with `git log` in a separate job.
- **Tauri updater template**: Set `active: false` initially with placeholder pubkey. Document manual activation steps (`tauri signer generate`, update endpoint setup).
- **JSON array syntax in metadata**: Ensure arrays in JSON files are not wrapped in strings. `"["item"]"` → `["item"]`.

## 2026-04-17 (Autonomous Verification)

- **Pre-existing state check**: Always run test suite and build before autonomous session to verify nothing broke since last commit
- **Git push needed**: `git status` showed "branch ahead by 1 commit" - remembered to push before finalizing

## 2026-04-17 Afternoon (TypeScript Fixes)

- **Episode metadata undefined**: `Episode` type has optional `metadata?: TvShowMetadata`, but `Movie` and `TvShow` have required metadata. Always check `metadata` exists before accessing properties.
- **MediaItem.title vs metadata.title**: `MediaItem` union types don't have `title` directly - `title` is in `metadata.title` for all types.posterPath only exists on `Movie` type.
- **chroma-js Color export**: Library exports `Color` at runtime but TypeScript types don't declare it. Use `@ts-expect-error` when runtime behavior is correct but types are incomplete.
- **Test file vi imports**: When using `vi.fn()` in JSX test files, ensure `vi` is imported: `import { ..., vi } from 'vitest'`.

## 2026-04-16 (Polish & Deployment Phase 2)

- **Revideo bundle size**: The Revideo library creates a large bundle (793KB/228KB gzipped) due to its comprehensive video processing features. This is inherent to the library and not a problem when gzipped size is reasonable.
- **GitHub Actions CI**: Create `.github/workflows/` directory with `ci.yml` for automated testing and builds. Use `concurrency` to cancel in-progress runs on new pushes to same branch.
- **Manual verification tasks**: Some tasks (memory profiling, smoke tests, Tauri launch) require manual testing and cannot be automated in CI.

## 2026-04-15 (Pipeline Integration Tests)

- **Fake timers with Promise.race**: `vi.useFakeTimers()` doesn't work well with `Promise.race` + `setTimeout` patterns. When testing timeout behavior, either skip the test or use a more controlled approach.
- **Rollback interface is optional**: `PipelineStage` defines `rollback?` as optional (`?`), but the orchestrator never calls it on failure. Document this as unimplemented if not needed.
- **Vitest test file ignores**: ESLint is configured to ignore all `src/**/*.test.ts` files, so new test files don't need to pass lint checks.

## 2026-04-15 PM (Polish & Deployment)

- **Tauri window config**: Window properties (width, height, minWidth, minHeight, resizable, center) are set directly in tauri.conf.json `app.windows[0]` object.
- **ProductName vs window title**: `productName` affects app metadata and window title unless explicitly set in `windows[].title`. Setting both ensures consistent naming.

## 2026-04-14 Evening (Testing & Quality)

- **Vitest coverage v8**: Use `reportOnFailure: true` in coverage config to generate coverage reports even when tests fail. Coverage thresholds can be set to current levels (lines 75%, functions 75%, branches 70%, statements 75%) and adjusted over time.
- **Vitest fs/promises mock pattern**: The pattern `vi.mock('fs/promises')` with async factory + dynamic `await import()` produces stale mock references. Correct pattern is `vi.mock('fs/promises', () => { const mock = vi.fn(); return { default: { readFile: mock }, readFile: mock }; })`. Include both `default` export and named export pointing to same mock.
- **Playwright config**: Create `playwright.config.ts` with webServer configuration to auto-start dev server during E2E tests. Add `playwright-report/` and `test-results/` to `.gitignore`.

## 2026-04-12 (Testing & Quality)

- **ESLint 10 compatibility**: eslint-plugin-react and eslint-plugin-jsx-a11y have issues with ESLint 10's new API; use simplified config without React plugins for now.
- **ESLint argsIgnorePattern**: Use `"argsIgnorePattern": "^_"` in no-unused-vars rule to allow underscore-prefixed unused function parameters.
- **ESLint test file config**: Separate ESLint config blocks for test files with `no-explicit-any: off` since tests often use `any` for mocks.

## 2026-04-14 (Prettier Integration)

- **Prettier + ESLint**: Use `eslint-config-prettier` to disable ESLint rules that conflict with Prettier formatting. Add `eslintConfigPrettier` at the end of eslint.config.mjs.
- **lint-staged**: Configure `.lintstagedrc` with file patterns and commands (e.g., `["eslint --fix", "prettier --write"]`) for pre-commit formatting.
- **husky pre-commit**: Update `.husky/pre-commit` to run `npx lint-staged` instead of just `npm test`.
- **chroma-js alias exports**: When aliasing `chroma-js` to a wrapper in Vite, must re-export ALL imports that downstream packages expect, including `Color`.

## 2026-04-11 (UI Components)

- **Tailwind v4 @theme**: Use `@theme inline` block to define CSS custom properties for colors when using Tailwind v4 with Vite
- **Vitest + React Testing Library**: Components need `vi.useFakeTimers()` for time-based features; tests for time display need fake timers
- **React component forwardRef**: Use `forwardRef` for ref forwarding in components like Button, Input, etc. to maintain ref compatibility
- **window.matchMedia**: Check if `window.matchMedia` exists before using it, as jsdom doesn't implement it
- **TDD for UI**: Write failing tests first, then implement minimal code to pass - all 162 UI component tests follow this pattern

## 2026-04-11

- **Pipeline types organization**: Keep domain-specific types in the module that owns them. Pipeline imports `MediaItem` from `library/types` rather than redefining.
- **ESM import paths**: From `src/lib/pipeline/stages/foo.ts`, import parent module types with `../types` (goes up one level to pipeline/, then types.ts).
- **fs/promises in ESM**: Use `import { unlink } from "fs/promises"` directly rather than `import { promises as fs }` for named imports.
- **Tauri plugin-store**: Not installed by default; use localStorage fallback for frontend-only checkpoint/history persistence.
- **Pipeline stage rollback**: Define rollback as optional `rollback?(ctx)` method on PipelineStage interface for cleanup on failure.

## 2026-04-10

- **Vitest class mocks**: Must use `vi.fn().mockImplementation(function() {...})` for class constructors, not arrow functions. Arrow functions don't work as constructors in `mockImplementation`.
- **AI service architecture**: AI runs in Bun/TypeScript frontend; Tauri/Rust handles video operations. Service layer coordinates AI operations with progress reporting.
- **Vitest dynamic imports**: `vi.mocked(readFile)` requires dynamic `await import('fs/promises')` after the `vi.mock` call, not before. The mock must be established before importing the module under test.
- **NFO regex closing tag**: When building regex patterns with template literals for XML parsing, ensure the closing tag is properly escaped: `</${tag}>` becomes `</${tag}>` in the string, but the `/` must be escaped as `\/` in the regex.

## 2026-04-09

- **Testing AI SDK mocks**: `GoogleGenAI` must be mocked as a constructor function, not an arrow function. Use `vi.fn().mockImplementation(function() {...})` or a function declaration for constructor mocks.
- **Mocking `fs/promises`**: Use `vi.mock("fs/promises", async (importOriginal) => {...})` with spread operator to preserve other exports while mocking specific functions.
- **Vitest fake timers**: `vi.useFakeTimers()` doesn't automatically fake `Date.now()`. Use `vi.setSystemTime()` to control time-based expiration in cache tests.
- **AI SDK imports**: Use named exports directly; `generateObject` from 'ai', `createVertex` from '@ai-sdk/google-vertex', `GoogleGenAI` from '@google/genai'
- **Bun unavailable**: When bun is not available, fall back to npm; the project will still work correctly
- **Config singleton**: Use module-level cached config with sync getter alongside async loadConfig for reactive UI updates
- **TypeScript .js extensions**: Don't use .js extensions in imports when using TypeScript's default module resolution

## 2026-04-08

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
