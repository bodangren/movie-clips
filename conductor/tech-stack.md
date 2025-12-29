# Technology Stack

## Core Technologies
- **Language:** TypeScript (Node.js)
  - Selected for its strong async capabilities, excellent JSON handling (critical for API integrations), and mature ecosystem for media orchestration.
- **Runtime:** Node.js (LTS)

## AI & Cloud Services
- **LLM:** Google Gemini 3.0 Flash/Pro (via `@google/genai`)
- **Text-to-Speech:** Gemini TTS (`gemini-2.5-flash-lite-preview-tts`, random voice per video)
- **Video Platform:** YouTube Data API v3 (via `googleapis`)

## Media Processing
- **Video Engine:** FFmpeg
- **Wrapper Library:** `fluent-ffmpeg`
- **Image Processing:** `puppeteer` (for generating title cards/overlays) or `sharp`

## Data & Metadata
- **Metadata Parsing:** `xml2js` (for parsing local `movie.nfo` files)
- **Subtitle Parsing:** `srt-parser-2` or similar robust parser

## Infrastructure
- **Scheduling:** `node-cron`
- **Logging:** `winston`
