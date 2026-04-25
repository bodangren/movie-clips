import { create } from 'zustand';
import type { MediaItem, Movie, TvShow } from '@/lib/library/types';
import { useConfigStore } from './config.store';

// Lazy import invoke to avoid issues if Tauri IPC isn't ready
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

interface LibraryState {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
  lastScanned: string | null;

  setItems: (items: MediaItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  scan: () => Promise<void>;
}

interface NfoData {
  title?: string;
  year?: string;
  plot?: string;
  tmdbId?: string;
  imdbId?: string;
}

async function parseNfo(nfoPath: string): Promise<NfoData | null> {
  try {
    const content = await tauriInvoke<string>('read_file', { path: nfoPath });
    const titleMatch = content.match(/<title>(.*?)<\/title>/);
    const yearMatch = content.match(/<year>(.*?)<\/year>/);
    const plotMatch = content.match(/<plot>(.*?)<\/plot>/s);
    const tmdbMatch = content.match(/<tmdbid>(.*?)<\/tmdbid>/);
    const imdbMatch = content.match(/<imdbid>(.*?)<\/imdbid>/);
    return {
      title: titleMatch?.[1],
      year: yearMatch?.[1],
      plot: plotMatch?.[1],
      tmdbId: tmdbMatch?.[1],
      imdbId: imdbMatch?.[1],
    };
  } catch {
    return null;
  }
}

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv'];

export const useLibraryStore = create<LibraryState>(set => ({
  items: [],
  loading: false,
  error: null,
  lastScanned: null,

  setItems: items => set({ items }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),

  scan: async () => {
    set({ loading: true, error: null });
    try {
      // Check Tauri IPC bridge
      if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
        set({ loading: false, error: 'Tauri IPC not available. Make sure you are running in the Tauri desktop app (bun run tauri dev).' });
        return;
      }

      const config = useConfigStore.getState().config;
      const scanPaths = [config.paths.movies, config.paths.tv].filter(Boolean);
      console.log('[Library] config paths:', JSON.stringify(config.paths));
      console.log('[Library] scan paths:', scanPaths);

      if (scanPaths.length === 0) {
        set({ loading: false, error: 'No library paths configured. Set paths in Settings.' });
        return;
      }

      const allItems: MediaItem[] = [];
      const errors: string[] = [];

      for (const dirPath of scanPaths) {
        try {
          console.log('[Library] scanning:', dirPath);
          const entries = await tauriInvoke<string[]>('scan_directory', { path: dirPath });
          console.log('[Library] entries in', dirPath, ':', JSON.stringify(entries));

          for (const entryName of entries) {
            const lastDot = entryName.lastIndexOf('.');
            const ext = lastDot > 0 ? entryName.substring(lastDot).toLowerCase() : '';
            const baseName = lastDot > 0 ? entryName.substring(0, lastDot) : entryName;

            if (VIDEO_EXTENSIONS.includes(ext)) {
              // Top-level video file → movie
              const nfoPath = `${dirPath}/${baseName}.nfo`;
              const nfo = await parseNfo(nfoPath);
              const movie: Movie = {
                path: `${dirPath}/${entryName}`,
                type: 'movie',
                name: entryName,
                extension: ext,
                size: 0,
                modifiedAt: new Date(),
                metadata: {
                  title: nfo?.title || baseName,
                  year: nfo?.year ? parseInt(nfo.year) : undefined,
                  plot: nfo?.plot,
                  tmdbId: nfo?.tmdbId,
                  imdbId: nfo?.imdbId,
                },
                nfoPath: nfo ? nfoPath : undefined,
                subtitlePaths: [],
                posterPath: `${dirPath}/folder.jpg`,
              };
              allItems.push(movie);
            } else if (!ext) {
              // Directory — check what it is
              try {
                const subEntries = await tauriInvoke<string[]>(`scan_directory`, { path: `${dirPath}/${entryName}` });

                // Check for TV show first (has tvshow.nfo)
                const hasTvNfo = subEntries.includes('tvshow.nfo');
                if (hasTvNfo) {
                  const nfo = await parseNfo(`${dirPath}/${entryName}/tvshow.nfo`);
                  const tvShow: TvShow = {
                    path: `${dirPath}/${entryName}`,
                    type: 'tvshow',
                    name: entryName,
                    extension: '',
                    size: 0,
                    modifiedAt: new Date(),
                    metadata: {
                      title: nfo?.title || entryName,
                      year: nfo?.year ? parseInt(nfo.year) : undefined,
                      plot: nfo?.plot,
                    },
                    nfoPath: `${dirPath}/${entryName}/tvshow.nfo`,
                  };
                  allItems.push(tvShow);
                } else {
                  // Not a TV show — check for video files (movie in subdirectory)
                  const videoFiles = subEntries.filter(e => {
                    const eExt = e.substring(e.lastIndexOf('.')).toLowerCase();
                    return VIDEO_EXTENSIONS.includes(eExt);
                  });

                  if (videoFiles.length > 0) {
                    const videoFile = videoFiles[0];
                    const videoBase = videoFile.substring(0, videoFile.lastIndexOf('.'));
                    const nfoPath = `${dirPath}/${entryName}/${videoBase}.nfo`;
                    const nfo = await parseNfo(nfoPath);
                    const movie: Movie = {
                      path: `${dirPath}/${entryName}/${videoFile}`,
                      type: 'movie',
                      name: entryName,
                      extension: videoFile.substring(videoFile.lastIndexOf('.')),
                      size: 0,
                      modifiedAt: new Date(),
                    metadata: {
                      title: nfo?.title || entryName,
                      year: nfo?.year ? parseInt(nfo.year) : undefined,
                      plot: nfo?.plot,
                      tmdbId: nfo?.tmdbId,
                      imdbId: nfo?.imdbId,
                    },
                      nfoPath: nfo ? nfoPath : undefined,
                      subtitlePaths: subEntries.filter(e => e.endsWith('.srt')).map(e => `${dirPath}/${entryName}/${e}`),
                      posterPath: `${dirPath}/${entryName}/folder.jpg`,
                    };
                    allItems.push(movie);
                  }
                }
              } catch {
                // Can't read directory, skip
              }
            }
          }
        } catch (err) {
          console.error('[Library] scan error for', dirPath, err);
          errors.push(`Failed to scan ${dirPath}: ${err}`);
        }
      }

      console.log('[Library] scan complete, items:', allItems.length, 'errors:', errors.length);
      if (allItems.length === 0 && errors.length === 0) {
        console.log('[Library] No video files found in:', scanPaths);
      }
      set({
        items: allItems,
        loading: false,
        lastScanned: new Date().toISOString(),
        error: errors.length > 0 ? errors.join('; ') : null,
      });
    } catch (err) {
      console.error('[Library] scan failed:', err);
      set({
        loading: false,
        error: `Scan failed: ${err}`,
      });
    }
  },
}));
