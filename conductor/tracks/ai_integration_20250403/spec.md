# Track Specification: AI/LLM Integration

## Overview
Port the Gemini analyzer and TTS generator to Bun runtime, maintaining TypeScript for AI/LLM logic where the ecosystem is strongest. Implement caching, retry logic, and error handling for reliable AI operations.

## Goals
1. Gemini analyzer for movie/TV content analysis (5 facts generation)
2. TTS generator using Gemini TTS with voice selection
3. Caching layer for API responses to reduce costs and improve performance
4. Retry logic with exponential backoff for API failures
5. Mock AI service for offline development and testing

## Acceptance Criteria
### Functional Requirements
- [ ] Analyze movie/TV content and generate 5 trivia facts with timestamps
- [ ] Generate TTS audio from text using Gemini TTS API
- [ ] Random voice selection from configured TTS voices
- [ ] Cache API responses with configurable TTL
- [ ] Implement retry logic with exponential backoff for failed requests
- [ ] Validate API responses against Zod schemas
- [ ] Mock service provides realistic responses for testing

### Non-Functional Requirements
- [ ] Gemini analysis response time < 30 seconds for typical movies
- [ ] TTS generation time < 10 seconds per fact
- [ ] Cache hit rate > 50% for repeated analyses
- [ ] Memory usage < 100MB for AI operations
- [ ] Error recovery rate > 90% for transient API failures

### Quality Requirements
- [ ] Generated facts meet quality criteria (surprising, spread across film, etc.)
- [ ] TTS audio quality matches or exceeds current implementation
- [ ] Error messages help diagnose API key issues, rate limits, etc.
- [ ] TypeScript types fully cover AI response schemas
- [ ] Comprehensive tests for success and failure scenarios

## Technical Decisions
### Architecture
- **Bun Runtime:** Execute TypeScript AI logic in Bun for 3-4x speed vs Node.js
- **Separation:** Keep AI logic in TypeScript, call from Rust via Tauri commands if needed
- **Caching:** In-memory cache with optional disk persistence
- **Mocking:** Complete mock service for offline development

### Dependencies
- **Gemini:** `@google/genai` for TTS, `@ai-sdk/google-vertex` for analysis
- **Caching:** Custom implementation or lightweight cache library
- **Validation:** Zod for response validation
- **Utilities:** Existing utilities from current codebase (ported to Bun)

## API Integration Details
### Gemini Analyzer
- Model: `gemini-2.5-flash` (or configured alternative)
- Prompt engineering for 5 facts with timestamps
- Response validation with Zod schema
- Error handling for content policy violations, rate limits

### TTS Generator
- Model: `gemini-2.5-flash-lite-preview-tts`
- Voice selection from configured list (random per video)
- Audio format: WAV for compatibility with video processing
- Error handling for voice availability, text length limits

## Dependencies
- **External:** Google AI SDKs, Bun runtime
- **Internal:** Track 2 (Configuration for API keys, settings)

## Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Bun compatibility with AI SDKs | Medium | High | Test early, have Node.js fallback plan |
| API rate limiting/costs | High | Medium | Implement caching, usage monitoring |
| TTS voice availability changes | Low | Medium | Configurable voice list with defaults |
| Response quality variability | Medium | Low | Prompt engineering, response validation |

## Success Metrics
- Analysis time: < 30 seconds (vs ~45 seconds in Node.js)
- TTS generation: < 10 seconds per fact
- Cache effectiveness: > 50% hit rate
- Error recovery: > 90% success after retries
- Bundle size: Minimal increase from AI dependencies

## Out of Scope
- Multiple LLM provider support (beyond Gemini)
- Advanced prompt tuning UI
- Batch processing optimization
- Local LLM inference

## References
- [Google AI JavaScript SDK](https://github.com/google/generative-ai-js)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Bun Performance](https://bun.sh/docs/benchmarks)
- [Exponential Backoff Patterns](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)