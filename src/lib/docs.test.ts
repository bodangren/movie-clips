import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const DOCS_DIR = resolve(__dirname, '../../docs');

describe('Documentation', () => {
  it('should have ARCHITECTURE.md', () => {
    const path = resolve(DOCS_DIR, 'ARCHITECTURE.md');
    expect(existsSync(path)).toBe(true);
  });

  it('should have CONTRIBUTING.md', () => {
    const path = resolve(DOCS_DIR, 'CONTRIBUTING.md');
    expect(existsSync(path)).toBe(true);
  });

  it('ARCHITECTURE.md should contain key sections', () => {
    const content = readFileSync(resolve(DOCS_DIR, 'ARCHITECTURE.md'), 'utf-8');
    expect(content).toContain('# Architecture Documentation');
    expect(content).toContain('## Overview');
    expect(content).toContain('## Technology Stack');
    expect(content).toContain('## System Architecture');
    expect(content).toContain('## Data Flow');
    expect(content).toContain('## Key Components');
  });

  it('CONTRIBUTING.md should contain key sections', () => {
    const content = readFileSync(resolve(DOCS_DIR, 'CONTRIBUTING.md'), 'utf-8');
    expect(content).toContain('# Contributing Guide');
    expect(content).toContain('## Development Environment Setup');
    expect(content).toContain('## Code Style and Conventions');
    expect(content).toContain('## Testing Requirements');
    expect(content).toContain('## Pull Request Process');
  });

  it('README should reference documentation', () => {
    const readme = readFileSync(resolve(__dirname, '../../README.md'), 'utf-8');
    expect(readme).toContain('[Architecture Overview](docs/ARCHITECTURE.md)');
    expect(readme).toContain('[Contributing Guide](docs/CONTRIBUTING.md)');
  });
});
