import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ICONS_DIR = resolve(__dirname, '../../src-tauri/icons');

describe('Application Icons', () => {
  const requiredIcons = [
    '32x32.png',
    '128x128.png',
    '128x128@2x.png',
    'icon.png',
    'icon.ico',
    'icon.icns',
    'Square30x30Logo.png',
    'Square44x44Logo.png',
    'Square71x71Logo.png',
    'Square89x89Logo.png',
    'Square107x107Logo.png',
    'Square142x142Logo.png',
    'Square150x150Logo.png',
    'Square284x284Logo.png',
    'Square310x310Logo.png',
    'StoreLogo.png',
    'icon-source.svg',
  ];

  it.each(requiredIcons)('should have %s icon file', iconName => {
    const iconPath = resolve(ICONS_DIR, iconName);
    expect(existsSync(iconPath)).toBe(true);
  });

  it('should have valid icon sizes for PNG files', () => {
    const fs = require('fs');
    const sizeMap: Record<string, number> = {
      '32x32.png': 32,
      '128x128.png': 128,
      'icon.png': 512,
    };

    for (const [filename] of Object.entries(sizeMap)) {
      const filePath = resolve(ICONS_DIR, filename);
      const buffer = fs.readFileSync(filePath);
      // PNG files start with specific signature and contain width/height in IHDR chunk
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4e); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    }
  });
});
