import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with default styling', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('bg-card');
  });

  it('applies hover class when hoverable is true', () => {
    render(<Card hoverable>Hover me</Card>);
    const card = screen.getByText('Hover me');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('renders CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader title="Card Title" description="Card description" />
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('renders CardContent with children', () => {
    render(
      <Card>
        <CardContent>Main content</CardContent>
      </Card>
    );
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders CardFooter with children', () => {
    render(
      <Card>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders all slots together', () => {
    render(
      <Card>
        <CardHeader title="Title" description="Desc" />
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('forwards className to Card', () => {
    render(<Card className="custom-class">Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('custom-class');
  });
});
