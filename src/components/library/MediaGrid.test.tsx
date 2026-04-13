import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaGrid } from './MediaGrid';
import type { Movie } from '@/lib/library/types';

describe('MediaGrid', () => {
  const mockMovies: Movie[] = [
    {
      path: '/movies/movie1.mkv',
      type: 'movie',
      name: 'Movie 1',
      extension: '.mkv',
      size: 1_000_000_000,
      modifiedAt: new Date(),
      metadata: { title: 'Movie 1', year: 2020 },
      subtitlePaths: [],
    },
    {
      path: '/movies/movie2.mkv',
      type: 'movie',
      name: 'Movie 2',
      extension: '.mkv',
      size: 1_200_000_000,
      modifiedAt: new Date(),
      metadata: { title: 'Movie 2', year: 2021 },
      subtitlePaths: [],
    },
  ];

  it('renders items in a grid', () => {
    render(<MediaGrid items={mockMovies} />);
    expect(screen.getByText('Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Movie 2')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<MediaGrid items={[]} />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    render(<MediaGrid items={[]} loading count={2} />);
    expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(2);
  });

  it('renders correct grid columns for different sizes', () => {
    const { rerender } = render(<MediaGrid items={mockMovies} columns="sm" />);
    expect(screen.getByTestId('media-grid')).toHaveClass(
      'grid-cols-2',
      'sm:grid-cols-3',
      'lg:grid-cols-4',
      'xl:grid-cols-5'
    );

    rerender(<MediaGrid items={mockMovies} columns="lg" />);
    expect(screen.getByTestId('media-grid')).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-3'
    );
  });

  it('handles item click', () => {
    const handleClick = vi.fn();
    render(<MediaGrid items={mockMovies} onItemClick={handleClick} />);
    const firstMovie = screen.getByText('Movie 1').closest("[data-testid='media-card']");
    firstMovie?.click();
    expect(handleClick).toHaveBeenCalledWith(mockMovies[0]);
  });
});
