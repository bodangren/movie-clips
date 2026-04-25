import { useState } from 'react';
import { Button } from '@/components/ui';
import {
  type BenchmarkSummary,
  type BenchmarkResult,
  runEncoderBenchmark,
} from '@/lib/video/service';
import { Activity, Clock, HardDrive, BarChart3, Trophy } from 'lucide-react';

export function BenchmarkPanel() {
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    setRunning(true);
    setError(null);
    try {
      const result = await runEncoderBenchmark();
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Benchmark failed');
    } finally {
      setRunning(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getHighlightClass = (result: BenchmarkResult) => {
    const classes: string[] = [];
    if (summary?.fastest_encoder === result.encoder) classes.push('text-primary');
    if (summary?.smallest_encoder === result.encoder) classes.push('font-semibold');
    if (summary?.best_quality_encoder === result.encoder)
      classes.push('border-l-2 border-primary pl-2');
    return classes.join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Encoder Benchmark</h3>
        </div>
        <Button onClick={handleRunBenchmark} loading={running} disabled={running} size="sm">
          {running ? 'Running...' : 'Run Benchmark'}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      {running && (
        <div className="text-sm text-muted-foreground p-4 text-center">
          Encoding reference clip and testing each encoder...
          <br />
          This may take a few minutes.
        </div>
      )}

      {summary && !running && (
        <div className="space-y-3">
          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            {summary.fastest_encoder && (
              <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                <Trophy size={12} />
                Fastest: {summary.fastest_encoder}
              </div>
            )}
            {summary.smallest_encoder && summary.smallest_encoder !== summary.fastest_encoder && (
              <div className="flex items-center gap-1 text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">
                <HardDrive size={12} />
                Smallest: {summary.smallest_encoder}
              </div>
            )}
            {summary.best_quality_encoder && (
              <div className="flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                <BarChart3 size={12} />
                Best Quality: {summary.best_quality_encoder}
              </div>
            )}
          </div>

          {/* Results table */}
          <div className="border border-white/5 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Encoder</th>
                  <th className="text-right px-3 py-2 font-medium">
                    <span className="flex items-center justify-end gap-1">
                      <Clock size={12} /> Time
                    </span>
                  </th>
                  <th className="text-right px-3 py-2 font-medium">
                    <span className="flex items-center justify-end gap-1">
                      <HardDrive size={12} /> Size
                    </span>
                  </th>
                  <th className="text-right px-3 py-2 font-medium">PSNR</th>
                  <th className="text-right px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.results.map(result => (
                  <tr
                    key={result.encoder}
                    className={`${getHighlightClass(result)} ${!result.success ? 'opacity-50' : ''}`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {result.encoder}
                      {result.encoder_type !== 'software' && (
                        <span className="ml-1 text-[10px] text-primary">GPU</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatDuration(result.duration_ms)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatSize(result.file_size_bytes)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {result.psnr_score ? `${result.psnr_score.toFixed(1)} dB` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {result.success ? (
                        <span className="text-xs text-green-400">Success</span>
                      ) : (
                        <span
                          className="text-xs text-destructive"
                          title={result.error_message || ''}
                        >
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!summary && !running && !error && (
        <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-white/10 rounded-md">
          Run a benchmark to compare encoder performance.
          <br />A 10-second reference clip will be encoded with each available encoder.
        </div>
      )}
    </div>
  );
}
