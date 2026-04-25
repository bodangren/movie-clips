import { type ReactNode, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  children: ReactNode;
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function Card({ hoverable = false, className = '', children, ...props }: CardProps) {
  const baseClasses =
    'rounded-lg border-glow bg-card text-card-foreground shadow-sm overflow-hidden';
  const hoverClasses = hoverable
    ? 'hover:border-primary/20 hover:shadow-primary/5 hover:shadow-md transition-pulse cursor-pointer'
    : '';

  const classes = [baseClasses, hoverClasses, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex flex-col space-y-1 p-4 border-b border-white/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold leading-none tracking-tight text-foreground uppercase tracking-wider">
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  const classes = ['p-4', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  const classes = ['flex items-center p-4 pt-0 border-t border-white/5 pt-4', className]
    .filter(Boolean)
    .join(' ');
  return <div className={classes}>{children}</div>;
}
