import { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className = '' }: PageHeaderProps) {
  const classes = ['flex flex-col gap-1 mb-4', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground uppercase tracking-widest">
          {title}
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-xs text-muted-foreground font-medium">{description}</p>}
    </div>
  );
}
