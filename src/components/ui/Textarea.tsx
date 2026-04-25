import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;

    const textareaClasses = [
      'flex min-h-[80px] w-full rounded-md border border-white/5 bg-muted px-3 py-2 text-sm transition-pulse',
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
            htmlFor={textareaId}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
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

Textarea.displayName = 'Textarea';
