import { useState } from 'react';
import { type AnalyticsRecord } from '@/lib/analytics/repository';
import { ArrowUpDown, Eye, Clock, ThumbsUp, MessageSquare } from 'lucide-react';

type SortField = 'views' | 'watchTimeMinutes' | 'likes' | 'comments' | 'subscribersGained';
type SortDirection = 'asc' | 'desc';

interface VideoPerformanceTableProps {
  records: AnalyticsRecord[];
}

export function VideoPerformanceTable({ records }: VideoPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterText, setFilterText] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filtered = records.filter(
    r =>
      r.title.toLowerCase().includes(filterText.toLowerCase()) ||
      r.videoId.toLowerCase().includes(filterText.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aVal - bVal) * multiplier;
  });

  const SortHeader = ({
    field,
    children,
    icon,
  }: {
    field: SortField;
    children: React.ReactNode;
    icon: React.ReactNode;
  }) => (
    <th
      className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {icon}
        {children}
        <ArrowUpDown size={12} className={sortField === field ? 'text-primary' : 'opacity-30'} />
      </div>
    </th>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filter by title or video ID..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="flex-1 h-9 px-3 rounded-md bg-input border border-white/5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">{sorted.length} videos</span>
      </div>

      <div className="border border-white/5 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Video</th>
              <SortHeader field="views" icon={<Eye size={12} />}>
                Views
              </SortHeader>
              <SortHeader field="watchTimeMinutes" icon={<Clock size={12} />}>
                Watch Time
              </SortHeader>
              <SortHeader field="likes" icon={<ThumbsUp size={12} />}>
                Likes
              </SortHeader>
              <SortHeader field="comments" icon={<MessageSquare size={12} />}>
                Comments
              </SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map(record => (
              <tr key={`${record.videoId}-${record.metricDate}`} className="hover:bg-white/5">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {record.thumbnailUrl ? (
                      <img
                        src={record.thumbnailUrl}
                        alt=""
                        className="w-10 h-7 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-7 rounded bg-secondary flex items-center justify-center">
                        <Eye size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate max-w-[200px]">{record.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {record.videoId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {record.views.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {Math.round(record.watchTimeMinutes).toLocaleString()} min
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {record.likes.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {record.comments.toLocaleString()}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No videos match your filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
