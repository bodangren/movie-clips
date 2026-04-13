import { type ReactNode } from 'react';

export interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MainLayout({ sidebar, children, className = '' }: MainLayoutProps) {
  const classes = ['flex min-h-screen', className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-testid="main-layout">
      {sidebar}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
