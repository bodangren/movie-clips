import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Settings" description="Configure your preferences" />);
    expect(screen.getByText('Configure your preferences')).toBeInTheDocument();
  });

  it('renders actions slot when provided', () => {
    render(<PageHeader title="Users" actions={<button>Add User</button>} />);
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<PageHeader title="Simple" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
