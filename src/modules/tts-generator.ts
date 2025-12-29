import { GoogleGenAI } from '@google/genai';
import fs from 'fs-extra';
import { logger } from '../utils/logger';
import { config } from '../config';

const TTS_MODEL = 'gemini-2.5-flash-lite-preview-tts';
const MAX_TTS_ATTEMPTS = 3;
const MAX_TTS_WORDS_PER_REQUEST = 45;

export class TtsGenerator {
  private client: GoogleGenAI;
  private voiceName: string | null;
  private clientMode: 'apiKey' | 'vertex';

  constructor() {
    this.clientMode = config.google.apiKey ? 'apiKey' : 'vertex';
    this.client = this.createClient(this.clientMode);
    this.voiceName = this.pickVoice(new Set());
  }

  async generate(text: string, outputPath: string): Promise<string | null> {
    if (!this.voiceName) {
      logger.error('Gemini TTS voice not configured. Set GEMINI_TTS_VOICES.');
      return null;
    }

    const chunks = this.splitTextForTts(text);
    const chunkBuffers: Buffer[] = [];

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const prefix = chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : '';
      logger.info(
        `Generating Gemini TTS${prefix} (${this.voiceName}) for: "${chunk.substring(0, 30)}..."`
      );

      const chunkBuffer = await this.synthesize(chunk);
      if (!chunkBuffer) {
        logger.error('Error during TTS generation: No audio content received from Gemini TTS');
        return null;
      }

      chunkBuffers.push(chunkBuffer);
    }

    const combined = this.combineWavBuffers(chunkBuffers);
    await fs.outputFile(outputPath, combined);
    logger.info(`TTS saved to ${outputPath}`);
    return outputPath;
  }

  private pickVoice(exclude: Set<string>): string | null {
    if (config.google.ttsVoices.length === 0) {
      return null;
    }

    const available = config.google.ttsVoices.filter((voice) => !exclude.has(voice));
    const pool = available.length > 0 ? available : config.google.ttsVoices;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  private splitTextForTts(text: string): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= MAX_TTS_WORDS_PER_REQUEST) {
      return [text.trim()];
    }

    const chunks: string[] = [];
    let buffer: string[] = [];

    for (const word of words) {
      buffer.push(word);
      if (buffer.length >= MAX_TTS_WORDS_PER_REQUEST) {
        chunks.push(buffer.join(' '));
        buffer = [];
      }
    }

    if (buffer.length > 0) {
      chunks.push(buffer.join(' '));
    }

    return chunks;
  }

  private async synthesize(text: string): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= MAX_TTS_ATTEMPTS; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: TTS_MODEL,
          contents: text,
          config: {
            responseModalities: ['audio'],
            speechConfig: {
              languageCode: 'en-US',
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: this.voiceName || undefined,
                },
              },
            },
          },
        });

        const audio = this.extractAudio(response);
        if (!audio?.data) {
          throw new Error('No audio content received from Gemini TTS');
        }

        const audioBuffer = Buffer.from(audio.data, 'base64');
        return this.normalizeToWav(audioBuffer, audio.mimeType);
      } catch (error) {
        if (this.clientMode === 'apiKey' && this.isModelNotFoundError(error)) {
          if (config.google.projectId && config.google.location) {
            logger.warn(
              'Gemini TTS model not available with API key; retrying with Vertex AI.'
            );
            this.clientMode = 'vertex';
            this.client = this.createClient('vertex');
            continue;
          }
        }

        if (attempt < MAX_TTS_ATTEMPTS) {
          logger.warn(`Gemini TTS attempt ${attempt} failed; retrying.`);
          continue;
        }

        logger.error(`Error during TTS generation: ${error}`);
        return null;
      }
    }

    return null;
  }

  private extractAudio(
    response: { data?: string; candidates?: any[] }
  ): { data: string; mimeType?: string } | null {
    if (response?.data) {
      return { data: response.data };
    }

    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inlineData = part?.inlineData;
      if (inlineData?.data) {
        return { data: inlineData.data, mimeType: inlineData.mimeType };
      }
    }

    return null;
  }

  private normalizeToWav(audioBuffer: Buffer, mimeType?: string): Buffer {
    if (this.isWavBuffer(audioBuffer)) {
      return audioBuffer;
    }

    const normalizedMimeType = (mimeType || '').toLowerCase();
    const isPcm =
      normalizedMimeType.includes('audio/l16') ||
      normalizedMimeType.includes('audio/pcm') ||
      normalizedMimeType.includes('codec=pcm');

    if (!mimeType || isPcm) {
      return this.wrapPcmInWav(audioBuffer, 24000, 1, 16);
    }

    return audioBuffer;
  }

  private combineWavBuffers(buffers: Buffer[]): Buffer {
    if (buffers.length === 1) {
      return buffers[0];
    }

    const pcmChunks = buffers.map((buffer) => this.extractPcmData(buffer));
    const combinedPcm = Buffer.concat(pcmChunks);
    return this.wrapPcmInWav(combinedPcm, 24000, 1, 16);
  }

  private extractPcmData(buffer: Buffer): Buffer {
    if (!this.isWavBuffer(buffer)) {
      return buffer;
    }

    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const chunkId = buffer.toString('ascii', offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);
      const dataStart = offset + 8;
      if (chunkId === 'data') {
        return buffer.slice(dataStart, dataStart + chunkSize);
      }
      offset = dataStart + chunkSize;
    }

    return buffer;
  }

  private isWavBuffer(buffer: Buffer): boolean {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WAVE'
    );
  }

  private wrapPcmInWav(
    pcmBuffer: Buffer,
    sampleRate: number,
    channels: number,
    bitsPerSample: number
  ): Buffer {
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0, 4, 'ascii');
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8, 4, 'ascii');
    header.write('fmt ', 12, 4, 'ascii');
    header.writeUInt32LE(16, 16); // PCM chunk size
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36, 4, 'ascii');
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  private createClient(mode: 'apiKey' | 'vertex'): GoogleGenAI {
    if (mode === 'apiKey') {
      return new GoogleGenAI({ apiKey: config.google.apiKey });
    }

    return new GoogleGenAI({
      vertexai: true,
      project: config.google.projectId,
      location: config.google.location,
    });
  }

  private isModelNotFoundError(error: unknown): boolean {
    const message = String(error);
    return message.includes(TTS_MODEL) && message.includes('NOT_FOUND');
  }
}
