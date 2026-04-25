import { useEffect, Suspense, lazy, useState } from 'react';
import {
  Film,
  Settings,
  Activity,
  LayoutDashboard,
  PlaySquare,
  ChevronRight,
  ChevronLeft,
  Monitor,
  BarChart3,
  Tv,
} from 'lucide-react';
import { MainLayout, Sidebar, PageHeader } from './components/layout';
import { useUIStore } from './stores/ui.store';
import { useConfigStore } from './stores/config.store';
import { useLibraryStore } from './stores/library.store';
import { MediaGrid } from './components/library';
import { PipelineMonitor } from './components/pipeline';
import { SettingsPanel } from './components/config';
import { AnalyticsPage } from './components/analytics';
import { ErrorBoundary } from './components/providers';
import { isMovie, isTvShow, type MediaItem, type TvShow } from './lib/library/types';
import { convertFileSrc } from '@tauri-apps/api/core';
import { usePipelineStore } from './stores/pipeline.store';

// Lazy load VideoPreview as it depends on Revideo which can be resource-intensive
const VideoPreview = lazy(() =>
  import('./components/pipeline/VideoPreview').then(m => ({ default: m.VideoPreview }))
);

function TvShowDetail({ item, onSelectEpisode }: { item: TvShow; onSelectEpisode: (item: MediaItem) => void }) {
  const [episodes, setEpisodes] = useState<{ name: string; path: string; season: number; episode: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEpisodes() {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const VIDEO_EXT = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv'];
        const found: { name: string; path: string; season: number; episode: number }[] = [];

        async function scanDir(dirPath: string, depth: number) {
          if (depth > 2) return; // max 2 levels deep (Show/Season/Episode)
          const items = await invoke<string[]>(`scan_directory`, { path: dirPath });
          for (const entry of items) {
            const ext = entry.substring(entry.lastIndexOf('.')).toLowerCase();
            const fullPath = `${dirPath}/${entry}`;

            if (VIDEO_EXT.includes(ext)) {
              const match = entry.match(/[sS](\d{1,2})[eE](\d{1,2})/);
              if (match) {
                found.push({ name: entry, path: fullPath, season: parseInt(match[1]), episode: parseInt(match[2]) });
              } else {
                found.push({ name: entry, path: fullPath, season: 1, episode: found.length + 1 });
              }
            } else if (!ext) {
              // Subdirectory — might be a season folder
              await scanDir(fullPath, depth + 1);
            }
          }
        }

        await scanDir(item.path, 0);
        found.sort((a, b) => a.season - b.season || a.episode - b.episode);
        setEpisodes(found);
      } catch (err) {
        console.error('[Library] failed to load episodes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEpisodes();
  }, [item.path]);

  const seasons = [...new Set(episodes.map(e => e.season))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tv size={24} /> {item.metadata.title}
        </h1>
        {item.metadata.year && <p className="text-muted-foreground mt-1">{item.metadata.year}</p>}
        {item.metadata.plot && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.metadata.plot}</p>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading episodes...</p>
      ) : episodes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No video files found in this show directory.</p>
      ) : (
        seasons.map(season => (
          <div key={season} className="glass rounded-xl border-glow p-4">
            <h3 className="text-sm font-semibold mb-3 text-primary">Season {season}</h3>
            <div className="space-y-1">
              {episodes.filter(e => e.season === season).map(ep => (
                <button
                  key={ep.path}
                  onClick={() => onSelectEpisode({
                    path: ep.path,
                    type: 'movie',
                    name: ep.name,
                    extension: ep.name.substring(ep.name.lastIndexOf('.')),
                    size: 0,
                    modifiedAt: new Date(),
                    metadata: { title: `${item.metadata.title} S${ep.season}E${ep.episode}` },
                    subtitlePaths: [],
                  })}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-pulse flex items-center gap-3 text-sm"
                >
                  <PlaySquare size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-mono text-xs w-12">E{ep.episode}</span>
                  <span className="truncate">{ep.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function App() {
  const { currentPage, sidebarOpen, navigate, toggleSidebar } = useUIStore();
  const { load: loadConfig } = useConfigStore();
  const { items: libraryItems, loading: libraryLoading, error: libraryError } = useLibraryStore();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'library', label: 'Media Library', icon: <Film size={20} /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Activity size={20} /> },
    { id: 'preview', label: 'Live Preview', icon: <PlaySquare size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-fade-in">
            <PageHeader
              title="Director's Dashboard"
              description="Overview of your movie clips production pipeline."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-xl border-glow-primary">
                <h3 className="text-primary font-semibold mb-2 flex items-center gap-2">
                  <Activity size={18} /> Active Pipeline
                </h3>
                <p className="text-sm text-muted-foreground mb-4">No active generation tasks.</p>
                <button
                  onClick={() => navigate('pipeline')}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Pipeline <ChevronRight size={14} />
                </button>
              </div>

              <div className="glass p-6 rounded-xl border-glow">
                <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                  <Film size={18} /> Library Status
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Library scan completed. {libraryItems.length} titles indexed.
                </p>
                <button
                  onClick={() => navigate('library')}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Browse Library <ChevronRight size={14} />
                </button>
              </div>

              <div className="glass p-6 rounded-xl border-glow">
                <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
                  <Monitor size={18} /> System
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All services operational. GPU acceleration active.
                </p>
                <button
                  onClick={() => navigate('settings')}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Check Settings <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Recent Projects</h3>
              <div className="glass rounded-xl border-glow h-48 flex items-center justify-center text-muted-foreground italic">
                No recent projects found.
              </div>
            </div>
          </div>
        );
      case 'library':
        if (selectedItem) {
          return (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-pulse"
              >
                <ChevronLeft size={16} /> Back to Library
              </button>
              {isMovie(selectedItem) && (
                <div className="space-y-6">
                  <div className="flex gap-6">
                    {selectedItem.posterPath && (
                      <img
                        src={convertFileSrc(selectedItem.posterPath)}
                        alt={selectedItem.metadata.title}
                        className="w-48 rounded-lg object-cover shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1 space-y-3">
                      <h1 className="text-2xl font-bold">{selectedItem.metadata.title}</h1>
                      {selectedItem.metadata.year && (
                        <p className="text-muted-foreground">{selectedItem.metadata.year}</p>
                      )}
                      {selectedItem.metadata.plot && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.metadata.plot}</p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            usePipelineStore.getState().setVideoMetadata({
                              title: selectedItem.metadata.title,
                              posterPath: selectedItem.posterPath || '',
                              sourceVideoPath: selectedItem.path,
                            });
                            navigate('pipeline');
                          }}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-pulse flex items-center gap-2"
                        >
                          <PlaySquare size={16} /> Generate Clips
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="glass rounded-xl border-glow p-4">
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">File Info</h3>
                    <p className="text-xs text-muted-foreground font-mono">{selectedItem.path}</p>
                  </div>
                </div>
              )}
              {isTvShow(selectedItem) && (
                <TvShowDetail item={selectedItem} onSelectEpisode={setSelectedItem} />
              )}
            </div>
          );
        }
        return (
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              title="Media Library"
              description="Scan and manage your movies and TV shows."
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => useLibraryStore.getState().scan()}
                disabled={libraryLoading}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-pulse disabled:opacity-50 flex items-center gap-2"
              >
                {libraryLoading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {libraryLoading ? 'Scanning...' : 'Scan Library'}
              </button>
              {libraryItems.length > 0 && (
                <span className="text-sm text-muted-foreground">{libraryItems.length} items found</span>
              )}
            </div>
            {libraryError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive-foreground">
                {libraryError}
              </div>
            )}
            {libraryItems.length === 0 && !libraryLoading && !libraryError && (
              <div className="p-4 rounded-lg bg-muted/50 border border-white/5 text-sm text-muted-foreground">
                No media found. Click <strong>Scan Library</strong> to detect movies and TV shows, or configure paths in <strong>Settings</strong>.
              </div>
            )}
            {libraryItems.length > 0 && (() => {
              const movies = libraryItems.filter(isMovie);
              const tvShows = libraryItems.filter(isTvShow);
              return (
                <>
                  {movies.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Film size={18} className="text-primary" /> Movies
                        <span className="text-sm text-muted-foreground font-normal">({movies.length})</span>
                      </h2>
                      <MediaGrid items={movies} loading={libraryLoading} onItemClick={setSelectedItem} />
                    </div>
                  )}
                  {tvShows.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Tv size={18} className="text-primary" /> TV Shows
                        <span className="text-sm text-muted-foreground font-normal">({tvShows.length})</span>
                      </h2>
                      <MediaGrid items={tvShows} loading={libraryLoading} onItemClick={setSelectedItem} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        );
      case 'pipeline':
        return (
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              title="Production Pipeline"
              description="Monitor and control the video generation process."
            />
            <PipelineMonitor />
          </div>
        );
      case 'preview':
        return (
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              title="Live Preview"
              description="Real-time preview of the Revideo composition."
            />
            <div className="max-w-4xl mx-auto glass rounded-2xl overflow-hidden border-glow-primary p-4 min-h-[400px]">
              <ErrorBoundary
                fallback={() => (
                  <div className="p-4 text-red-500">Failed to load preview engine</div>
                )}
              >
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Loading preview engine...
                    </div>
                  }
                >
                  <VideoPreview />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              title="Content Analytics"
              description="Track video performance and audience engagement."
            />
            <AnalyticsPage />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6 animate-fade-in max-w-2xl">
            <PageHeader
              title="Settings"
              description="Configure your environment and API integrations."
            />
            <div className="glass p-6 rounded-2xl border-glow">
              <SettingsPanel />
            </div>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <MainLayout
      sidebar={
        <Sidebar
          links={links}
          currentId={currentPage}
          collapsed={!sidebarOpen}
          onToggle={toggleSidebar}
          onNavigate={navigate}
          className="border-white/5"
        />
      }
    >
      <div className="max-w-7xl mx-auto">{renderContent()}</div>
    </MainLayout>
  );
}

export default App;
