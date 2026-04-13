import { useState, type ReactNode } from 'react';

export interface ConfigSectionProps {
  title: string;
  description?: string;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
}

export function ConfigSection({
  title,
  description,
  defaultCollapsed = false,
  collapsible = true,
  children,
  className = '',
}: ConfigSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = (): void => {
    if (collapsible) {
      setCollapsed(prev => !prev);
    }
  };

  return (
    <div
      data-testid="config-section"
      className={['rounded-lg border bg-card', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        onClick={toggleCollapse}
        className="flex items-center justify-between w-full p-4 text-left"
        disabled={!collapsible}
      >
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {collapsible && (
          <span data-testid="collapse-indicator" className="text-muted-foreground">
            {collapsed ? (
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
                <path d="m6 9 6 6 6-6" />
              </svg>
            ) : (
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
                <path d="m18 15-6-6-6 6" />
              </svg>
            )}
          </span>
        )}
      </button>
      {!collapsed && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}
