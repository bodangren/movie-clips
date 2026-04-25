import { create } from 'zustand';
import { Fact } from '@/lib/video/revideo/types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { MediaItem } from '@/lib/library/types';

export type PipelineStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

interface PipelineState {
  status: PipelineStatus;
  progress: number;
  currentStep: string;
  errors: string[];

  // Video Metadata
  title: string;
  posterPath: string;
  sourceVideoPath: string;
  facts: Fact[];
  outroText: string;

  start: () => Promise<void>;
  updateProgress: (progress: number, step: string) => void;
  complete: () => void;
  fail: (error: string) => void;
  pause: () => void;
  reset: () => void;
  addError: (error: string) => void;
  setVideoMetadata: (
    metadata: Partial<{
      title: string;
      posterPath: string;
      sourceVideoPath: string;
      facts: Fact[];
      outroText: string;
    }>
  ) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  status: 'idle',
  progress: 0,
  currentStep: '',
  errors: [],

  // Video Metadata
  title: '',
  posterPath: '',
  sourceVideoPath: '',
  facts: [],
  outroText: 'Subscribe for more!',

  start: async () => {
    const { sourceVideoPath, title, posterPath } = get();
    if (!sourceVideoPath) {
      set({ status: 'failed', errors: ['No source video selected. Go to Library and click Generate Clips on a movie.'] });
      return;
    }

    set({ status: 'running', progress: 0, currentStep: 'Starting pipeline...', errors: [] });

    // Listen for progress events from the Tauri backend
    const unlistenProgress = await listen<number>('pipeline-progress', (event) => {
      set({ progress: event.payload });
    });
    const unlistenStage = await listen<string>('pipeline-stage', (event) => {
      set({ currentStep: event.payload });
    });
    const unlistenStatus = await listen<string>('pipeline-status', (event) => {
      if (event.payload === 'completed') {
        set({ status: 'completed', progress: 100, currentStep: 'Done!' });
      } else if (event.payload === 'failed') {
        set({ status: 'failed' });
      }
    });
    const unlistenError = await listen<string>('pipeline-error', (event) => {
      set(state => ({ errors: [...state.errors, event.payload] }));
    });

    try {
      await invoke('run_pipeline', {
        request: {
          sourcePath: sourceVideoPath,
          title: title || 'Untitled',
          posterPath: posterPath || '',
          outputDir: './output',
        },
      });
    } catch (err) {
      set(state => ({ status: 'failed', errors: [...state.errors, `Pipeline error: ${err}`] }));
    } finally {
      unlistenProgress();
      unlistenStage();
      unlistenStatus();
      unlistenError();
    }
  },

  updateProgress: (progress, step) => set({ progress, currentStep: step }),
  complete: () => set({ status: 'completed', progress: 100, currentStep: 'Completed' }),
  fail: error => set(state => ({ status: 'failed', errors: [...state.errors, error] })),
  pause: () => set({ status: 'paused' }),
  reset: () => set({ status: 'idle', progress: 0, currentStep: '', errors: [] }),
  addError: error => set(state => ({ errors: [...state.errors, error] })),
  setVideoMetadata: metadata => set(state => ({ ...state, ...metadata })),
}));
