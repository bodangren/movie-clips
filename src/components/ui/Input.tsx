import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;

    const inputClasses = [
      'flex h-9 w-full rounded-md border border-white/5 bg-muted px-3 py-1 text-sm transition-pulse',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground/50',
      'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50',
      'disabled:cursor-not-allowed disabled:opacity-30',
      error ? 'border-destructive focus:ring-destructive' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          {...props}
        />
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

Input.displayName = 'Input';
