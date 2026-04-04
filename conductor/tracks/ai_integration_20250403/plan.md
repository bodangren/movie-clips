# Track Plan: AI/LLM Integration

## Status Notes
- **Created:** 2025-04-03
- **Priority:** High
- **Estimated Duration:** 3 days
- **Dependencies:** config_state_20250403

## Phase 1: Gemini Analyzer Setup
- [ ] Task: Install AI SDK dependencies
    - [ ] Sub-task: Install `@ai-sdk/google-vertex` via Bun
    - [ ] Sub-task: Install `ai` (Vercel AI SDK) via Bun
    - [ ] Sub-task: Install `@google/genai` via Bun
    - [ ] Sub-task: Install `zod` for response validation
- [ ] Task: Port Gemini analyzer from backup-old
    - [ ] Sub-task: Review `backup-old/src/modules/llm-analyzer.ts` for reference
    - [ ] Sub-task: Create `src/lib/ai/analyzer.ts` with `generateObject` pattern
    - [ ] Sub-task: Define Zod schema for 5-fact analysis response
    - [ ] Sub-task: Implement prompt engineering for movie trivia extraction
    - [ ] Sub-task: Add error handling for content policy violations and rate limits
- [ ] Task: Write tests for analyzer
    - [ ] Sub-task: Create `src/lib/ai/analyzer.test.ts`
    - [ ] Sub-task: Test with mock responses
    - [ ] Sub-task: Test Zod schema validation
    - [ ] Sub-task: Test error handling

## Phase 2: TTS Generator
- [ ] Task: Port TTS generator from backup-old
    - [ ] Sub-task: Review `backup-old/src/modules/tts-generator.ts` for reference
    - [ ] Sub-task: Create `src/lib/ai/tts.ts` using Gemini TTS (`gemini-2.5-flash-lite-preview-tts`)
    - [ ] Sub-task: Implement random voice selection from configured voices
    - [ ] Sub-task: Use `@google/genai` SDK (NOT `@google-cloud/text-to-speech`)
    - [ ] Sub-task: Output WAV format for FFmpeg compatibility
- [ ] Task: Write tests for TTS generator
    - [ ] Sub-task: Create `src/lib/ai/tts.test.ts`
    - [ ] Sub-task: Test voice selection logic
    - [ ] Sub-task: Test with mock API responses
    - [ ] Sub-task: Test error handling

## Phase 3: Caching & Retry Layer
- [ ] Task: Implement response caching
    - [ ] Sub-task: Create `src/lib/ai/cache.ts` with in-memory cache
    - [ ] Sub-task: Implement configurable TTL for cached responses
    - [ ] Sub-task: Add cache key generation from request parameters
    - [ ] Sub-task: Add optional disk persistence for cache
- [ ] Task: Implement retry logic
    - [ ] Sub-task: Create `src/lib/ai/retry.ts` with exponential backoff
    - [ ] Sub-task: Configure max retries and initial delay
    - [ ] Sub-task: Add jitter to prevent thundering herd
    - [ ] Sub-task: Implement retry for transient errors only
- [ ] Task: Write tests for caching and retry
    - [ ] Sub-task: Test cache hit/miss behavior
    - [ ] Sub-task: Test TTL expiration
    - [ ] Sub-task: Test retry with failures
    - [ ] Sub-task: Test retry exhaustion

## Phase 4: Mock Service & Integration
- [ ] Task: Create mock AI service
    - [ ] Sub-task: Create `src/lib/ai/mock-service.ts`
    - [ ] Sub-task: Implement realistic mock responses
    - [ ] Sub-task: Add configurable delays and errors for testing
    - [ ] Sub-task: Toggle mock service via configuration
- [ ] Task: Integrate with Tauri commands
    - [ ] Sub-task: Create Tauri commands for AI operations
    - [ ] Sub-task: Implement frontend service layer
    - [ ] Sub-task: Add progress reporting for long operations
    - [ ] Sub-task: Test end-to-end with mock service
- [ ] Task: Conductor - User Manual Verification 'AI/LLM Integration'
    - [ ] Sub-task: Test Gemini analyzer with real movie data
    - [ ] Sub-task: Test TTS generation with sample text
    - [ ] Sub-task: Verify cache reduces duplicate API calls
    - [ ] Sub-task: Verify retry handles transient failures

## Success Checklist
- [ ] Gemini analyzer generates 5 facts with timestamps
- [ ] TTS generates WAV audio from text with random voice
- [ ] Cache reduces duplicate API calls by > 50%
- [ ] Retry recovers from > 90% of transient failures
- [ ] Mock service enables offline development
- [ ] All tests pass
- [ ] Integration with Tauri commands works

## Notes
- Keep AI logic in TypeScript/Bun (ecosystem strongest here)
- Gemini TTS voices configured in config (Track 2) or defaults from `src/config.ts`
- Vertex API uses project/location + ADC (NOT API key auth)
- `@google/genai` for TTS, `@ai-sdk/google-vertex` for analysis
