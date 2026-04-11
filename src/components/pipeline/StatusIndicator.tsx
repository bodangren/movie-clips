import type { PipelineStatus } from "@/stores/pipeline.store";

export interface StatusIndicatorProps {
  status: PipelineStatus;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<PipelineStatus, { color: string; label: string }> = {
  idle: { color: "bg-muted", label: "Idle" },
  running: { color: "bg-blue-500 animate-pulse", label: "Running" },
  completed: { color: "bg-green-500", label: "Completed" },
  failed: { color: "bg-red-500", label: "Failed" },
  paused: { color: "bg-yellow-500", label: "Paused" },
};

export function StatusIndicator({
  status,
  showLabel = false,
  className = "",
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeClasses = "w-3 h-3 rounded-full";

  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <span
        data-testid="status-indicator"
        className={[sizeClasses, config.color].join(" ")}
        data-status={status}
      />
      {showLabel && <span className="text-sm font-medium">{config.label}</span>}
    </div>
  );
}
