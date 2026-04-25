import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;

    const selectClasses = [
      'flex h-9 w-full rounded-md border border-white/5 bg-muted px-3 py-1 text-sm transition-pulse appearance-none',
      'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50',
      'disabled:cursor-not-allowed disabled:opacity-30',
      error ? 'border-destructive focus:ring-destructive' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="space-y-1.5 relative">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={selectClasses}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-card text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && (
          <p
            id={errorId}
            className="text-[10px] text-destructive font-medium uppercase tracking-tight"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
