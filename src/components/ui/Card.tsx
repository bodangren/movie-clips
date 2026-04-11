import { type ReactNode, type HTMLAttributes } from "react";

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

export function Card({ hoverable = false, className = "", children, ...props }: CardProps) {
  const baseClasses = "rounded-lg border bg-card text-card-foreground shadow-sm";
  const hoverClasses = hoverable ? "hover:shadow-lg transition-shadow cursor-pointer" : "";
  
  const classes = [baseClasses, hoverClasses, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex flex-col space-y-1.5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardContentProps) {
  const classes = ["p-6 pt-0", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  const classes = ["flex items-center p-6 pt-0", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}
