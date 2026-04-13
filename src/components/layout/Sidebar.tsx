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
  const baseClasses = 'flex flex-col h-full bg-card border-r transition-all duration-300';
  const collapsedClasses = collapsed ? 'w-16' : 'w-64';
  const classes = [baseClasses, collapsedClasses, className].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        {!collapsed && (
          <span className="font-bold text-xl tracking-tight text-primary">MOVIE CLIPS</span>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
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
              {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {links.map(link => {
            const isActive = link.id === currentId;
            const linkClasses = [
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            ].join(' ');

            return (
              <li key={link.id}>
                <button onClick={() => onNavigate?.(link.id)} className={linkClasses}>
                  {link.icon && (
                    <span
                      className={
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-primary group-hover:scale-110 transition-transform'
                      }
                    >
                      {link.icon}
                    </span>
                  )}
                  {!collapsed && <span className="font-medium">{link.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="glass p-3 rounded-xl text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            System Operational
          </div>
        </div>
      )}
    </aside>
  );
}
