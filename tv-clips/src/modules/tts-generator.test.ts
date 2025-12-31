import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';

const genaiMocks = vi.hoisted(() => {
  const instances: Array<{ options: any; generateContent: ReturnType<typeof vi.fn> }> = [];
  const defaultResponse = {
    data: Buffer.from('fake audio data').toString('base64'),
  };
  const GoogleGenAI = vi.fn((options) => {
    const generateContent = vi.fn().mockResolvedValue(defaultResponse);
    instances.push({ options, generateContent });
    return { models: { generateContent } };
  });
  return { instances, GoogleGenAI };
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: genaiMocks.GoogleGenAI,
}));

describe('TtsGenerator', () => {
  beforeEach(() => {
    vi.resetModules();
    genaiMocks.instances.length = 0;
    genaiMocks.GoogleGenAI.mockClear();
    process.env.GEMINI_TTS_VOICES = 'Voice-A,Voice-B';
    process.env.GOOGLE_API_KEY = 'test-api-key';
    process.env.GOOGLE_PROJECT_ID = 'test-project';
    process.env.GOOGLE_LOCATION = 'us-central1';
  });

  it('should generate an audio file', async () => {
    const { TtsGenerator } = await import('./tts-generator');
    const tts = new TtsGenerator();
    const outputPath = 'temp/test_tts.wav';
    
    vi.spyOn(fs, 'outputFile').mockResolvedValue(undefined as never);

    const initOptions = genaiMocks.GoogleGenAI.mock.calls[0]?.[0] ?? {};
    expect(initOptions.apiKey).toBe('test-api-key');
    expect(initOptions.project).toBeUndefined();
    expect(initOptions.location).toBeUndefined();
    expect(initOptions.vertexai).toBeUndefined();

    const result = await tts.generate('Hello world', outputPath);

    expect(result).toBe(outputPath);
    expect(genaiMocks.instances[0].generateContent).toHaveBeenCalled();
    const request = genaiMocks.instances[0].generateContent.mock.calls[0][0];
    expect(request.model).toBe('gemini-2.5-flash-lite-preview-tts');
    expect(request.config.responseModalities).toEqual(['audio']);
    expect(['Voice-A', 'Voice-B']).toContain(
      request.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName
    );
    expect(fs.outputFile).toHaveBeenCalledWith(outputPath, expect.any(Buffer));
  });

  it('falls back to Vertex AI when API key model is unavailable', async () => {
    const { TtsGenerator } = await import('./tts-generator');
    const tts = new TtsGenerator();
    const outputPath = 'temp/test_tts.wav';

    vi.spyOn(fs, 'outputFile').mockResolvedValue(undefined as never);

    genaiMocks.instances[0].generateContent.mockRejectedValue(
      new Error(
        'ApiError: {"error":{"code":404,"message":"models/gemini-2.5-flash-lite-preview-tts is not found for API version v1beta","status":"NOT_FOUND"}}'
      )
    );

    const result = await tts.generate('Hello world', outputPath);

    expect(result).toBe(outputPath);
    expect(genaiMocks.GoogleGenAI).toHaveBeenCalledTimes(2);
    expect(genaiMocks.GoogleGenAI.mock.calls[0][0]).toEqual({ apiKey: 'test-api-key' });
    expect(genaiMocks.GoogleGenAI.mock.calls[1][0]).toEqual({
      vertexai: true,
      project: 'test-project',
      location: 'us-central1',
    });
  });
});
