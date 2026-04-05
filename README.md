# movie-clips

Tauri 2.x desktop app with React 19 frontend for generating movie/TV clips with AI analysis and TTS.

## Tech Stack

- **Runtime:** Bun (preferred) / npm (fallback)
- **Frontend:** React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Build:** Vite 8
- **Backend:** Rust (Tauri 2.x)
- **Testing:** Vitest (TypeScript) + cargo test (Rust)

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- Rust toolchain (rustup)
- System dependencies: `librsvg2-dev` (Linux), Xcode CLI tools (macOS), WebView2 (Windows)

### Installation

```bash
# Install dependencies
npm install

# Or with Bun
bun install
```

### Development

```bash
# Frontend only (Vite dev server)
npm run dev

# Full Tauri app with hot reload
npm run tauri dev
```

### Testing

```bash
# Run all TypeScript tests
npm test

# Watch mode
npm run test:watch

# Run Rust tests
cd src-tauri && cargo test
```

### Building

```bash
# Frontend production build
npm run build

# Full Tauri production build
npm run tauri build
```

## Project Structure

```
├── src/                    # React frontend (TypeScript)
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   ├── index.css           # Tailwind CSS import
│   ├── App.css             # Component styles
│   └── test/               # Test utilities
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri commands and app logic
│   │   └── main.rs         # Entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── conductor/              # Project management (Conductor)
│   └── tracks/             # Track plans and specs
└── package.json            # Project configuration
```

## Tauri Commands

| Command | Description | Returns |
|---------|-------------|---------|
| `greet` | Returns greeting message | `String` |
| `get_app_info` | Returns app metadata | `AppInfo` |
| `scan_directory` | Lists directory contents | `Vec<String>` |

## Architecture

```
Foundation → Config → AI
    ↓           ↓
  FFmpeg    → Library
      ↘       ↙
      Pipeline → UI
          ↓
      Testing → Polish
```

## Troubleshooting

- **Tauri dev fails:** Install `librsvg2-dev` (Linux) or equivalent system dependency
- **Bun unavailable:** Use `npm install` as fallback (bun.sh may be unreachable)
- **Tailwind warnings:** LightningCSS `@theme` warnings are non-blocking upstream issues
