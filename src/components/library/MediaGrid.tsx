import { type MediaItem } from "@/lib/library/types";
import { MediaCard } from "./MediaCard";
import { Skeleton } from "@/components/ui";

export type MediaGridColumns = "sm" | "md" | "lg";

export interface MediaGridProps {
  items: MediaItem[];
  loading?: boolean;
  count?: number;
  columns?: MediaGridColumns;
  onItemClick?: (item: MediaItem) => void;
  className?: string;
}

const columnClasses: Record<MediaGridColumns, string> = {
  sm: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  md: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  lg: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export function MediaGrid({
  items,
  loading = false,
  count = 12,
  columns = "md",
  onItemClick,
  className = "",
}: MediaGridProps) {
  const classes = [
    "grid gap-4",
    columnClasses[columns],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <div data-testid="media-grid" className={classes}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} data-testid="skeleton-loader" className="rounded-lg overflow-hidden">
            <Skeleton variant="rect" className="aspect-[2/3]" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
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
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <p className="mt-4 text-lg">No items found</p>
      </div>
    );
  }

  return (
    <div data-testid="media-grid" className={classes}>
      {items.map((item) => (
        <MediaCard
          key={item.path}
          item={item}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  );
}
