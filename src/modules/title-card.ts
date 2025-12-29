import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface TitleCardData {
  number: number;
  text: string;
  movie: string;
  year: number;
}

export class TitleCardGenerator {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'src', 'templates', 'title-card.html');
  }

  async generate(data: TitleCardData, outputPath: string): Promise<string> {
    logger.info(`Generating title card for fact #${data.number}`);

    await this.ensureTemplate();
    const template = await fs.readFile(this.templatePath, 'utf-8');
    
    // Simple template replacement
    const html = template
      .replace('{{number}}', data.number.toString())
      .replace('{{text}}', data.text)
      .replace('{{movie}}', data.movie)
      .replace('{{year}}', data.year.toString());

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setViewport({
        width: config.video.targetWidth,
        height: config.video.targetHeight
      });
      await page.setContent(html);
      await page.screenshot({ path: outputPath });
      
      logger.info(`Title card saved to ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error(`Error generating title card: ${error}`);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async ensureTemplate() {
    if (!(await fs.pathExists(this.templatePath))) {
      await fs.ensureDir(path.dirname(this.templatePath));
      const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; width: 100%; height: 100%; background: #111; color: white; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  h1 { font-size: 120px; color: #FFD700; margin: 0; text-transform: uppercase; }
  .fact { font-size: 52px; margin: 50px 100px; line-height: 1.4; }
  .footer { font-size: 40px; color: #888; position: absolute; bottom: 100px; }
</style>
</head>
<body>
  <h1>Fact #{{number}}</h1>
  <div class="fact">{{text}}</div>
  <div class="footer">{{movie}} ({{year}})</div>
</body>
</html>
      `;
      await fs.writeFile(this.templatePath, defaultTemplate);
    }
  }
}
