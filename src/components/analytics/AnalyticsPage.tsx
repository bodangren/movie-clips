import React, { useState } from 'react';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { VideoPerformanceTable } from './VideoPerformanceTable';
import { TrendChart } from './TrendChart';
import { type AnalyticsRecord } from '@/lib/analytics/repository';

interface AnalyticsPageProps {
  records?: AnalyticsRecord[];
}

export function AnalyticsPage({ records = [] }: AnalyticsPageProps) {
  const [dateRange, setDateRange] = useState('7');
  const [activeMetric, setActiveMetric] = useState<'views' | 'watchTime' | 'likes'>('views');

  // Generate trend data from records
  const trendData = React.useMemo(() => {
    const grouped = new Map<string, { views: number; watchTime: number; likes: number }>();

    records.forEach(record => {
      const existing = grouped.get(record.metricDate) || {
        views: 0,
        watchTime: 0,
        likes: 0,
      };
      grouped.set(record.metricDate, {
        views: existing.views + record.views,
        watchTime: existing.watchTime + record.watchTimeMinutes,
        likes: existing.likes + record.likes,
      });
    });

    return Array.from(grouped.entries())
      .map(([date, metrics]) => ({
        date: date.slice(5), // Remove year for cleaner display
        views: metrics.views,
        watchTime: Math.round(metrics.watchTime),
        likes: metrics.likes,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // Calculate aggregated metrics
  const totals = React.useMemo(() => {
    return records.reduce(
      (acc, record) => ({
        views: acc.views + record.views,
        watchTime: acc.watchTime + record.watchTimeMinutes,
        likes: acc.likes + record.likes,
        comments: acc.comments + record.comments,
        videos: new Set([...Array.from(acc.videos), record.videoId]).size,
      }),
      { views: 0, watchTime: 0, likes: 0, comments: 0, videos: new Set<string>() }
    );
  }, [records]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Content Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="h-8 px-2 rounded-md bg-input border border-white/5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-glow">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{totals.views.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </CardContent>
        </Card>
        <Card className="border-glow">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(totals.watchTime).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Watch Time (min)</div>
          </CardContent>
        </Card>
        <Card className="border-glow">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {totals.likes.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Likes</div>
          </CardContent>
        </Card>
        <Card className="border-glow">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{totals.videos}</div>
            <div className="text-xs text-muted-foreground">Videos Tracked</div>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <Card className="border-glow">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Performance Trend
            </div>
          }
        />
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            {(['views', 'watchTime', 'likes'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeMetric === metric
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {metric === 'watchTime'
                  ? 'Watch Time'
                  : metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
          <TrendChart data={trendData} metric={activeMetric} />
        </CardContent>
      </Card>

      {/* Video performance table */}
      <Card className="border-glow">
        <CardHeader title="Video Performance" />
        <CardContent className="p-4">
          <VideoPerformanceTable records={records} />
        </CardContent>
      </Card>
    </div>
  );
}
