import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  kbd?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground border-glow-primary hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground border border-white/5 hover:bg-secondary/80',
  ghost: 'bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      kbd,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md transition-pulse focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-30 disabled:cursor-not-allowed tracking-tight';

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label="loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className="flex items-center gap-2">
          {children}
          {kbd && !loading && <span className="kbd-hint">{kbd}</span>}
        </span>
      </>
    );

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={classes}
        aria-busy={loading}
        type={props.type ?? 'button'}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
