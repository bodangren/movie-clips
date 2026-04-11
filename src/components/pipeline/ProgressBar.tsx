export interface ProgressBarProps {
  value: number;
  showValue?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  showValue = false,
  label,
  animate = true,
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const isComplete = clampedValue === 100;
  const fillColor = isComplete ? "bg-green-500" : "bg-primary";

  const fillClasses = [
    fillColor,
    "h-full rounded-full transition-all",
    animate ? "duration-300" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["w-full", className].filter(Boolean).join(" ")}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && <span className="font-medium">{clampedValue}%</span>}
        </div>
      )}
      <div
        data-testid="progress-bar"
        className="w-full h-2 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          data-testid="progress-fill"
          className={fillClasses}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
