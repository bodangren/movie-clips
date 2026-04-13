import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, type SidebarLink } from './Sidebar';

const mockLinks: SidebarLink[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <span data-testid="icon-home" /> },
  { id: 'library', label: 'Library', icon: <span data-testid="icon-lib" /> },
];

describe('Sidebar', () => {
  it('renders the sidebar title', () => {
    render(<Sidebar links={mockLinks} />);
    expect(screen.getByText('MOVIE CLIPS')).toBeInTheDocument();
  });

  it('renders all provided links when not collapsed', () => {
    render(<Sidebar links={mockLinks} collapsed={false} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('applies active class to current route', () => {
    render(<Sidebar links={mockLinks} currentId="dashboard" />);
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveClass('bg-primary');
  });

  it('calls onToggle when collapse button is clicked', () => {
    const handleToggle = vi.fn();
    render(<Sidebar links={mockLinks} collapsed={false} onToggle={handleToggle} />);
    const toggleButton = screen.getByLabelText('Collapse');
    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('calls onNavigate when a link is clicked', () => {
    const handleNavigate = vi.fn();
    render(<Sidebar links={mockLinks} onNavigate={handleNavigate} />);
    const libraryButton = screen.getByText('Library');
    fireEvent.click(libraryButton);
    expect(handleNavigate).toHaveBeenCalledWith('library');
  });

  it('hides labels when collapsed', () => {
    render(<Sidebar links={mockLinks} collapsed={true} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Library')).not.toBeInTheDocument();
  });
});
