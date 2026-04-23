# Contributing Guide

Thank you for your interest in contributing to Movie Clips! This document provides guidelines for setting up the development environment and contributing code.

## Development Environment Setup

### Prerequisites

- **Node.js** >= 20.0.0 (or **Bun** >= 1.0)
- **Rust** >= 1.70 (for Tauri backend)
- **FFmpeg** installed and available in PATH
- **Git**

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bodangren/movie-clips.git
   cd movie-clips
   ```

2. Install dependencies:

   ```bash
   npm install
   # or if using Bun:
   bun install
   ```

3. Install Tauri CLI (if not already installed):

   ```bash
   cargo install tauri-cli
   ```

4. Set up environment variables (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your Google Cloud credentials
   ```

### Running the Application

**Development mode (frontend only):**

```bash
npm run dev
```

**Full Tauri app:**

```bash
npm run tauri dev
```

## Code Style and Conventions

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow the existing ESLint configuration
- Use **functional components** with hooks for React
- Prefer **named exports** over default exports
- Use **async/await** over raw promises

### React Conventions

- Components should be in `src/components/` organized by feature
- Custom hooks in `src/hooks/`
- Services in `src/lib/`
- Types in `src/types/` or co-located with usage

Example component structure:

```tsx
// src/components/feature/ComponentName.tsx
import { useState } from 'react';

interface ComponentNameProps {
  title: string;
}

export function ComponentName({ title }: ComponentNameProps) {
  const [count, setCount] = useState(0);

  return (
    <div>
      {title}: {count}
    </div>
  );
}
```

### Rust Conventions

- Follow Rust standard naming conventions
- Add `#[allow(dead_code)]` only for intentionally unused API surface
- Use `?` operator for error propagation
- Document public functions with doc comments

### Commit Conventions

We use **conventional commits** for automated changelog generation:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

Examples:

```
feat(pipeline): add retry logic for failed stages
fix(ui): resolve sidebar collapse animation
 docs(readme): update installation instructions
```

## Testing Requirements

### Running Tests

**Unit tests:**

```bash
npm test
# or with coverage:
npm run coverage
```

**E2E tests:**

```bash
npm run test:e2e
```

**Linting:**

```bash
npx eslint src/
```

**Type checking:**

```bash
npx tsc --noEmit
```

### Writing Tests

- Write tests **before** implementation (TDD)
- Target >80% coverage for new code
- Test files should be co-located: `foo.ts` → `foo.test.ts`
- Use descriptive test names: `it('should handle empty input gracefully')`
- Mock external dependencies (fs, API calls)

Example test:

```ts
import { describe, it, expect, vi } from 'vitest';
import { parseMedia } from './media-parser';

describe('Media Parser', () => {
  it('should extract title from valid NFO file', async () => {
    const result = await parseMedia('test.nfo');
    expect(result.title).toBe('Test Movie');
  });

  it('should throw on missing file', async () => {
    await expect(parseMedia('missing.nfo')).rejects.toThrow();
  });
});
```

## Pull Request Process

1. **Create a branch** from `master`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style conventions

3. **Run quality checks** before committing:

   ```bash
   npm test
   npx eslint src/
   npx tsc --noEmit
   ```

4. **Commit** with conventional commit format

5. **Push** your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Test results

### PR Review Criteria

- [ ] Tests pass locally
- [ ] Code follows style guides
- [ ] No TypeScript errors
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions

## Project Structure

```
movie-clips/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Services and utilities
│   ├── types/              # Shared TypeScript types
│   └── stores/             # Zustand state stores
├── src-tauri/              # Rust backend
│   ├── src/                # Rust source code
│   ├── icons/              # Application icons
│   └── Cargo.toml          # Rust dependencies
├── conductor/              # Project management (Conductor framework)
│   ├── tracks/             # Feature tracks
│   └── tracks.md           # Project status
├── docs/                   # Documentation
├── public/                 # Static assets
└── tests/                  # E2E tests
```

## Troubleshooting

### Common Issues

**Build fails with FFmpeg errors:**

- Ensure FFmpeg is installed and in PATH
- Check `ffmpeg -version` works in terminal

**Tauri development server won't start:**

- Verify Rust toolchain: `rustc --version`
- Check port 1420 is not in use

**Tests fail with mock errors:**

- Ensure `vi.mock()` is at the top of test files
- Use `vi.mocked()` for type-safe mocks

**TypeScript errors in Revideo files:**

- These are known third-party type issues
- Use `@ts-expect-error` with descriptive comment if blocking

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Join discussions for architectural decisions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
