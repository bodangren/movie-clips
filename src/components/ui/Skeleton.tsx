import { type HTMLAttributes } from "react";

export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: "rounded",
  circle: "rounded-full",
  rect: "rounded-md",
};

export function Skeleton({ variant = "text", className = "", children, ...props }: SkeletonProps) {
  const classes = [
    "animate-pulse bg-muted",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
