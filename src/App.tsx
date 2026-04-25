import { useEffect, Suspense, lazy } from 'react';
import {
  Film,
  Settings,
  Activity,
  LayoutDashboard,
  PlaySquare,
  ChevronRight,
  Monitor,
  BarChart3,
} from 'lucide-react';
import { MainLayout, Sidebar, PageHeader } from './components/layout';
import { useUIStore } from './stores/ui.store';
import { useConfigStore } from './stores/config.store';
import { useLibraryStore } from './stores/library.store';
import { MediaGrid, FilterBar } from './components/library';
import { PipelineMonitor } from './components/pipeline';
import { SettingsPanel } from './components/config';
import { AnalyticsPage } from './components/analytics';
import { ErrorBoundary } from './components/providers';

// Lazy load VideoPreview as it depends on Revideo which can be resource-intensive
const VideoPreview = lazy(() =>
  import('./components/pipeline/VideoPreview').then(m => ({ default: m.VideoPreview }))
);

function App() {
  const { currentPage, sidebarOpen, navigate, toggleSidebar } = useUIStore();
  const { load: loadConfig } = useConfigStore();
  const { items: libraryItems, loading: libraryLoading } = useLibraryStore();

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
        return (
          <div className="space-y-6 animate-fade-in">
            <PageHeader
              title="Media Library"
              description="Scan and manage your movies and TV shows."
            />
            <FilterBar />
            <MediaGrid items={libraryItems} loading={libraryLoading} />
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
