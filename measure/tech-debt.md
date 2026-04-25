# Tech Debt

## Open Issues

1. **Tauri updater not activated**: Updater config has `active: false` and placeholder pubkey. Needs `tauri signer generate` and update server.
2. **Tailwind CSS v4 warnings**: LightningCSS minifier shows `@theme` warnings (non-blocking, upstream issue).
3. **No Bun runtime**: Using npm fallback due to network restrictions.
4. **SettingsPanel zodResolver type mismatch**: Zod v4 schema inference differs from `@hookform/resolvers` expectations. Needs type cast or library update.
5. **YouTube scheduler timezone bug**: Test fails when run after 12:00 UTC due to `Date()` vs mocked time.
6. **Pipeline stages use Node.js fs**: `generate-assets.ts` and `process-video.ts` import `fs/promises` — cannot run in browser, must go through Tauri commands.
7. **Pipeline `select-content` stage re-scans library**: Uses Node.js `fs` via `libraryScanner.scan()` — redundant when media item is already selected.
8. **~56 TypeScript errors remain**: Mostly in Revideo integration (third-party types) and known issues (zodResolver, Cache/RetryConfig). Don't affect runtime.
9. **Manual verification never done**: YouTube OAuth, upload, GPU encoding, analytics — all marked complete but never tested end-to-end.
10. **Library scan only finds top-level files**: Doesn't recurse into season subdirectories for TV episodes (fixed in UI but scan logic still shallow).

## Resolved (keep for reference, remove when over 50 lines)

- Pre-existing test failures in subtitle-parser/nfo-parser: FIXED (mock pattern rework)
- chroma-js Color export missing: FIXED (added re-export)
- CI workflow wrong Rust action: FIXED (dtolnay/rust-toolchain)
- Config defaults missing youtube field: FIXED
- Missing @types/uuid: FIXED
- Unused imports cleaned: FIXED
