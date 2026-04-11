import { useState, type ReactNode } from "react";

export interface SidebarLink {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface SidebarProps {
  links: SidebarLink[];
  currentPath?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function Sidebar({
  links,
  currentPath = "/",
  collapsed = false,
  onToggle,
  className = "",
}: SidebarProps) {
  const baseClasses = "flex flex-col h-full bg-card border-r transition-all duration-300";
  const collapsedClasses = collapsed ? "w-16" : "w-64";
  const classes = [baseClasses, collapsedClasses, className].filter(Boolean).join(" ");

  return (
    <aside className={classes}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <span className="font-semibold text-lg">Movie Clips</span>}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-accent"
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {collapsed ? (
                <path d="m9 18 6-6-6-6" />
              ) : (
                <path d="m15 18-6-6 6-6" />
              )}
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = link.href === currentPath;
            const linkClasses = [
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
            ].join(" ");
            return (
              <li key={link.href}>
                <a href={link.href} className={linkClasses}>
                  {link.icon && <span className="w-5 h-5">{link.icon}</span>}
                  {!collapsed && <span>{link.label}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
