import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface TitleCardData {
  header: string;
  text: string;
  footer: string;
  backgroundImage?: string;
  topLogoImage?: string;
}

export class TitleCardGenerator {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'src', 'templates', 'title-card.html');
  }

  async generate(data: TitleCardData, outputPath: string): Promise<string> {
    logger.info(`Generating title card: ${data.header}`);

    await this.ensureTemplate();
    const template = await fs.readFile(this.templatePath, 'utf-8');
    
    // Simple template replacement
    const backgroundUrl = data.backgroundImage
      ? `url("file://${path.resolve(data.backgroundImage)}")`
      : 'none';
    const logoMarkup = data.topLogoImage
      ? `<img class="top-logo" src="file://${path.resolve(data.topLogoImage)}" alt="logo" />`
      : '';

    const html = template
      .replace('{{background_image}}', backgroundUrl)
      .replace('{{logo_markup}}', logoMarkup)
      .replace('{{header}}', data.header)
      .replace('{{text}}', data.text)
      .replace('{{footer}}', data.footer);

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
  :root { color-scheme: dark; }
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #0f1115;
    color: #f7f4ef;
    font-family: "Teko", "Arial Narrow", sans-serif;
    display: flex;
    align-items: stretch;
    justify-content: center;
    overflow: hidden;
  }
  .background {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top, rgba(255,255,255,0.06), rgba(0,0,0,0.75)),
      linear-gradient(135deg, #11151f, #0a0b12);
    background-image: var(--bg-image);
    background-size: cover;
    background-position: center;
    filter: saturate(1.05) contrast(1.05);
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8,10,16,0.75) 0%, rgba(8,10,16,0.65) 55%, rgba(8,10,16,0.85) 100%);
  }
  .content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 90px;
    gap: 36px;
  }
  .top-logo {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    max-height: 140px;
    max-width: 60%;
    object-fit: contain;
  }
  .header {
    font-size: 90px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #f8e7b9;
    text-shadow: 0 16px 30px rgba(0,0,0,0.45);
  }
  .text {
    font-size: 54px;
    line-height: 1.35;
    max-width: 980px;
    text-shadow: 0 12px 24px rgba(0,0,0,0.5);
  }
  .footer {
    font-size: 36px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
  }
</style>
<link href="https://fonts.googleapis.com/css2?family=Teko:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="background" style="--bg-image: {{background_image}};"></div>
  <div class="overlay"></div>
  <div class="content">
    {{logo_markup}}
    <div class="header">{{header}}</div>
    <div class="text">{{text}}</div>
    <div class="footer">{{footer}}</div>
  </div>
</body>
</html>
      `;
      await fs.writeFile(this.templatePath, defaultTemplate);
    }
  }
}
