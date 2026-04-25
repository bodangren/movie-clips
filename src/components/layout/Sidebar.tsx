import { type ReactNode } from 'react';

export interface SidebarLink {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface SidebarProps {
  links: SidebarLink[];
  currentId?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: (id: string) => void;
  className?: string;
}

export function Sidebar({
  links,
  currentId = 'dashboard',
  collapsed = false,
  onToggle,
  onNavigate,
  className = '',
}: SidebarProps) {
  const baseClasses =
    'flex flex-col h-full bg-background border-r border-white/5 transition-all duration-300';
  const collapsedClasses = collapsed ? 'w-16' : 'w-60';
  const classes = [baseClasses, collapsedClasses, className].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <div className="flex items-center justify-between p-4 mb-2">
        {!collapsed && (
          <span className="font-bold text-xs tracking-[0.2em] text-primary uppercase">
            MOVIE CLIPS
          </span>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-pulse"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 px-2">
        <ul className="space-y-0.5">
          {links.map(link => {
            const isActive = link.id === currentId;
            const linkClasses = [
              'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-pulse group',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent',
            ].join(' ');

            return (
              <li key={link.id}>
                <button onClick={() => onNavigate?.(link.id)} className={linkClasses}>
                  {link.icon && (
                    <span
                      className={
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-primary transition-colors'
                      }
                    >
                      {link.icon}
                    </span>
                  )}
                  {!collapsed && (
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {link.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4">
          <div className="glass p-3 rounded-lg text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] font-bold border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Pulse Active
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
