import { type MediaItem } from '@/lib/library/types';

export interface MediaCardProps {
  item: MediaItem;
  showGenres?: boolean;
  showRuntime?: boolean;
  onClick?: () => void;
  className?: string;
}

function formatRuntime(minutes?: number): string {
  if (!minutes) return '';
  return `${minutes} min`;
}

export function MediaCard({
  item,
  showGenres = false,
  showRuntime = false,
  onClick,
  className = '',
}: MediaCardProps) {
  const title = item.metadata.title;
  const year = item.metadata.year;
  const genres = item.metadata.genres;

  const cardClasses = [
    'group relative rounded-lg overflow-hidden bg-card border transition-all hover:shadow-lg cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-testid="media-card"
      className={cardClasses}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <div className="aspect-[2/3] relative bg-muted">
        {item.type === 'movie' && 'posterPath' in item && item.posterPath ? (
          <img
            src={`file://${item.posterPath}`}
            alt={`${title} poster`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            data-testid="media-card-placeholder"
            className="w-full h-full flex items-center justify-center bg-muted"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {year}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold truncate" title={title}>
          {title}
        </h3>
        {showGenres && genres && genres.length > 0 && (
          <p className="text-sm text-muted-foreground truncate">{genres.slice(0, 2).join(', ')}</p>
        )}
        {showRuntime && item.type === 'movie' && item.metadata.runtime && (
          <p className="text-sm text-muted-foreground">{formatRuntime(item.metadata.runtime)}</p>
        )}
      </div>
    </div>
  );
}
