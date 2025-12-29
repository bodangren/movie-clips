import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const DEFAULT_GEMINI_TTS_VOICES = [
  'Achernar',
  'Achird',
  'Algenib',
  'Algieba',
  'Alnilam',
  'Aoede',
  'Autonoe',
  'Callirrhoe',
  'Charon',
  'Despina',
  'Enceladus',
  'Erinome',
  'Fenrir',
  'Gacrux',
  'Iapetus',
  'Kore',
  'Laomedeia',
  'Leda',
  'Orus',
  'Pulcherrima',
  'Puck',
  'Rasalgethi',
  'Sadachbia',
  'Sadaltager',
  'Schedar',
  'Sulafat',
  'Umbriel',
  'Vindemiatrix',
  'Zephyr',
  'Zubenelgenubi',
];

export const config = {
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    projectId: process.env.GOOGLE_PROJECT_ID || '',
    // Default to 'global' for Gemini 3 Flash Preview as proven by tests
    location: process.env.GOOGLE_LOCATION || 'global',
    ttsVoices: (() => {
      const fromEnv = (process.env.GEMINI_TTS_VOICES || '')
        .split(',')
        .map((voice) => voice.trim())
        .filter(Boolean);
      return fromEnv.length > 0 ? fromEnv : DEFAULT_GEMINI_TTS_VOICES;
    })(),
  },
  paths: {
    movies: process.env.MOVIES_PATH || path.join(process.cwd(), 'Movies'),
    output: process.env.OUTPUT_PATH || path.join(process.cwd(), 'output'),
    temp: process.env.TEMP_PATH || path.join(process.cwd(), 'temp'),
    data: path.join(process.cwd(), 'data'),
  },
  video: {
    targetWidth: 720,
    targetHeight: 1280, // 9:16 aspect ratio, 720 short side
    fps: 30,
  },
};
