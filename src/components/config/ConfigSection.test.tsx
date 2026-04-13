import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigSection } from './ConfigSection';

describe('ConfigSection', () => {
  it('renders title', () => {
    render(<ConfigSection title="Paths">Content</ConfigSection>);
    expect(screen.getByText('Paths')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ConfigSection title="Paths" description="Configure your library paths">
        Content
      </ConfigSection>
    );
    expect(screen.getByText('Configure your library paths')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ConfigSection title="Section">
        <p>Child content</p>
      </ConfigSection>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('starts expanded by default', () => {
    render(<ConfigSection title="Section">Content</ConfigSection>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('starts collapsed when defaultCollapsed is true', () => {
    render(
      <ConfigSection title="Section" defaultCollapsed>
        Content
      </ConfigSection>
    );
    const content = screen.queryByText('Content');
    expect(content).not.toBeInTheDocument();
  });

  it('toggles collapsed state when header is clicked', () => {
    render(<ConfigSection title="Section">Content</ConfigSection>);
    fireEvent.click(screen.getByText('Section'));
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Section'));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows collapse indicator when collapsible is true', () => {
    render(
      <ConfigSection title="Section" collapsible>
        Content
      </ConfigSection>
    );
    expect(screen.getByTestId('collapse-indicator')).toBeInTheDocument();
  });

  it('hides collapse indicator when collapsible is false', () => {
    render(
      <ConfigSection title="Section" collapsible={false}>
        Content
      </ConfigSection>
    );
    expect(screen.queryByTestId('collapse-indicator')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ConfigSection title="Section" className="custom-class">
        Content
      </ConfigSection>
    );
    const section = screen.getByTestId('config-section');
    expect(section).toHaveClass('custom-class');
  });
});
