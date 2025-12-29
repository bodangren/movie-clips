import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { SubtitleParser } from './subtitle-parser';

describe('SubtitleParser', () => {
  const sampleSrt = `
1
00:00:54,920 --> 00:00:57,081
What is this <i>having-a-picnic</i> shit in my car?

2
00:00:57,189 --> 00:00:59,749
Please, man, I'm not getting my sex at home.
  `;

  it('should parse SRT content correctly and clean text', async () => {
    const tempSrt = path.join(process.cwd(), 'temp', 'test.srt');
    await fs.ensureDir(path.dirname(tempSrt));
    await fs.writeFile(tempSrt, sampleSrt);

    const parser = new SubtitleParser();
    const entries = await parser.parse(tempSrt);

    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe('What is this having-a-picnic shit in my car?');
    expect(entries[0].startTime).toBe('00:00:54,920');
    expect(entries[0].startTimeMS).toBe(54920);
    
    await fs.remove(tempSrt);
  });
});
