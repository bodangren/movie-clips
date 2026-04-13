import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renders sidebar and content', () => {
    render(
      <MainLayout sidebar={<div>Sidebar</div>}>
        <div>Main Content</div>
      </MainLayout>
    );
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    render(
      <MainLayout sidebar={<nav>Nav</nav>}>
        <h1>Page Title</h1>
        <p>Page content</p>
      </MainLayout>
    );
    expect(screen.getByRole('heading', { name: 'Page Title' })).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('applies full height class', () => {
    render(
      <MainLayout sidebar={<div>Sidebar</div>}>
        <div>Content</div>
      </MainLayout>
    );
    const layout = screen.getByTestId('main-layout');
    expect(layout).toHaveClass('min-h-screen');
  });
});
