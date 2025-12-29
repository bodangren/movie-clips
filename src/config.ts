import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
  },
  paths: {
    movies: process.env.MOVIES_PATH || path.join(process.cwd(), 'Movies'),
    output: process.env.OUTPUT_PATH || path.join(process.cwd(), 'output'),
    temp: process.env.TEMP_PATH || path.join(process.cwd(), 'temp'),
    data: path.join(process.cwd(), 'data'),
  },
  video: {
    targetWidth: 1080,
    targetHeight: 1920, // 9:16 aspect ratio
    fps: 30,
  }
};
