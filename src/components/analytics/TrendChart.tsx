import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  views: number;
  watchTime: number;
  likes: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  metric?: 'views' | 'watchTime' | 'likes';
}

export function TrendChart({ data, metric = 'views' }: TrendChartProps) {
  const metricConfig = {
    views: { color: '#8b5cf6', label: 'Views' },
    watchTime: { color: '#10b981', label: 'Watch Time (min)' },
    likes: { color: '#f59e0b', label: 'Likes' },
  };

  const config = metricConfig[metric];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            tickFormatter={value =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0c0c0c',
              border: '1px solid #1f2937',
              borderRadius: '4px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: config.color }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={config.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: config.color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
