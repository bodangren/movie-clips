import { type ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className = "" }: PageHeaderProps) {
  const classes = ["flex flex-col gap-2 mb-6", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
