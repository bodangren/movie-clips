import { useState, useEffect } from 'react';
import { usePipelineStore, type PipelineStatus } from '@/stores/pipeline.store';
import { StatusIndicator } from './StatusIndicator';
import { ProgressBar } from './ProgressBar';
import { LogViewer, type LogEntry, type LogLevel } from './LogViewer';
import { Button } from '@/components/ui';

export interface PipelineMonitorProps {
  showLogFilter?: boolean;
  className?: string;
}

export function PipelineMonitor({ showLogFilter = false, className = '' }: PipelineMonitorProps) {
  const { status, progress, currentStep, errors, start, pause, reset } = usePipelineStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<LogLevel | undefined>(undefined);

  useEffect(() => {
    if (currentStep) {
      setLogs(prev => [
        ...prev,
        {
          timestamp: new Date(),
          level: 'info',
          message: currentStep,
        },
      ]);
    }
  }, [currentStep]);

  useEffect(() => {
    if (errors.length > 0) {
      errors.forEach(error => {
        setLogs(prev => [
          ...prev,
          {
            timestamp: new Date(),
            level: 'error',
            message: error,
          },
        ]);
      });
    }
  }, [errors]);

  const handleStart = (): void => {
    start();
  };

  const handlePause = (): void => {
    pause();
  };

  const handleResume = (): void => {
    start();
  };

  const handleReset = (): void => {
    setLogs([]);
    reset();
  };

  const handleClearLogs = (): void => {
    setLogs([]);
  };

  const statusColors: Record<PipelineStatus, string> = {
    idle: 'text-muted-foreground',
    running: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    paused: 'text-yellow-500',
  };

  return (
    <div
      className={['bg-card rounded-lg border p-4 space-y-4', className].filter(Boolean).join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} showLabel />
          {currentStep && <span className={`text-sm ${statusColors[status]}`}>{currentStep}</span>}
        </div>
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <Button onClick={handleStart} size="sm">
              Start
            </Button>
          )}
          {status === 'running' && (
            <Button onClick={handlePause} variant="secondary" size="sm">
              Pause
            </Button>
          )}
          {status === 'paused' && (
            <Button onClick={handleResume} size="sm">
              Resume
            </Button>
          )}
          {status !== 'idle' && (
            <Button onClick={handleReset} variant="ghost" size="sm">
              Reset
            </Button>
          )}
        </div>
      </div>

      <ProgressBar value={progress} showValue label={currentStep} />

      {errors.length > 0 && (
        <div className="text-sm text-red-500">
          {errors.length} error{errors.length > 1 ? 's' : ''}
        </div>
      )}

      {showLogFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            size="sm"
            variant={logFilter === undefined ? 'primary' : 'ghost'}
            onClick={() => setLogFilter(undefined)}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={logFilter === 'error' ? 'primary' : 'ghost'}
            onClick={() => setLogFilter('error')}
          >
            Errors
          </Button>
          <Button
            size="sm"
            variant={logFilter === 'warn' ? 'primary' : 'ghost'}
            onClick={() => setLogFilter('warn')}
          >
            Warnings
          </Button>
        </div>
      )}

      <LogViewer logs={logs} filter={logFilter} showTimestamp onClear={handleClearLogs} />
    </div>
  );
}
