import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import revideo from '@revideo/vite-plugin';
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    // @ts-ignore
    (revideo.default || revideo)({
      project: './src/lib/video/revideo/project.ts',
    }).filter(p => p.name !== 'revideo:editor'),
    {
      name: 'fix-rolldown-target',
      config(config) {
        if (config.build?.target === 'modules') {
          config.build.target = 'esnext';
        }
      },
    },
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'chroma-js': path.resolve(__dirname, './src/chroma-wrapper.ts'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
}));
