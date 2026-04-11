import { useRef, useEffect, type ReactNode } from "react";

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
}

export interface LogViewerProps {
  logs: LogEntry[];
  filter?: LogLevel;
  showTimestamp?: boolean;
  autoScroll?: boolean;
  onClear?: () => void;
  className?: string;
}

const levelColors: Record<LogLevel, string> = {
  info: "border-l-blue-500",
  warn: "border-l-yellow-500",
  error: "border-l-red-500",
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogEntryComponent({
  entry,
  showTimestamp,
}: {
  entry: LogEntry;
  showTimestamp: boolean;
}) {
  const levelColor = levelColors[entry.level];
  return (
    <div className={`log-entry border-l-4 pl-3 py-1 ${levelColor}`}>
      <div className="flex items-center gap-2 text-sm">
        {showTimestamp && (
          <span className="text-muted-foreground font-mono text-xs">
            {formatTimestamp(entry.timestamp)}
          </span>
        )}
        <span className="text-xs uppercase font-semibold text-muted-foreground">
          {entry.level}
        </span>
      </div>
      <p className="text-sm break-words">{entry.message}</p>
    </div>
  );
}

export function LogViewer({
  logs,
  filter,
  showTimestamp = false,
  autoScroll = false,
  onClear,
  className = "",
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = filter ? logs.filter((log) => log.level === filter) : logs;

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleScrollToBottom = (): void => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  return (
    <div className={["flex flex-col bg-card rounded-lg border", className]
      .filter(Boolean)
      .join(" ")}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Logs</h3>
        <div className="flex items-center gap-2">
          {autoScroll && (
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Scroll to bottom
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear logs
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        data-testid="log-viewer"
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64"
      >
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No logs yet</p>
        ) : (
          filteredLogs.map((log, index) => (
            <LogEntryComponent
              key={index}
              entry={log}
              showTimestamp={showTimestamp}
            />
          ))
        )}
      </div>
    </div>
  );
}
