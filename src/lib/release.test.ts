import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT_DIR = resolve(__dirname, '../..');

describe('Release Configuration', () => {
  it('should have release workflow', () => {
    const path = resolve(ROOT_DIR, '.github/workflows/release.yml');
    expect(existsSync(path)).toBe(true);
  });

  it('release workflow should configure multi-platform builds', () => {
    const content = readFileSync(resolve(ROOT_DIR, '.github/workflows/release.yml'), 'utf-8');
    expect(content).toContain('macos-latest');
    expect(content).toContain('ubuntu-22.04');
    expect(content).toContain('windows-latest');
    expect(content).toContain('tauri-apps/tauri-action');
  });

  it('should have CHANGELOG.md', () => {
    const path = resolve(ROOT_DIR, 'CHANGELOG.md');
    expect(existsSync(path)).toBe(true);
  });

  it('CHANGELOG should follow Keep a Changelog format', () => {
    const content = readFileSync(resolve(ROOT_DIR, 'CHANGELOG.md'), 'utf-8');
    expect(content).toContain('# Changelog');
    expect(content).toContain('## [Unreleased]');
    expect(content).toContain('Keep a Changelog');
    expect(content).toContain('Semantic Versioning');
  });

  it('tauri.conf.json should have updater configuration', () => {
    const config = JSON.parse(
      readFileSync(resolve(ROOT_DIR, 'src-tauri/tauri.conf.json'), 'utf-8')
    );
    expect(config.plugins).toBeDefined();
    expect(config.plugins.updater).toBeDefined();
    expect(config.plugins.updater.active).toBe(false);
    expect(config.plugins.updater.dialog).toBe(true);
  });
});
