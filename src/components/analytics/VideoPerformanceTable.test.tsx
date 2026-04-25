import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPerformanceTable } from './VideoPerformanceTable';
import type { AnalyticsRecord } from '@/lib/analytics/repository';

const mockRecords: AnalyticsRecord[] = [
  {
    videoId: 'v1',
    title: 'First Video',
    publishedAt: '2024-01-15',
    metricDate: '2024-01-20',
    views: 5000,
    watchTimeMinutes: 300,
    likes: 250,
    comments: 50,
    subscribersGained: 30,
    subscribersLost: 2,
    averageViewDuration: 36,
    thumbnailUrl: 'http://example.com/1.jpg',
  },
  {
    videoId: 'v2',
    title: 'Second Video',
    publishedAt: '2024-01-16',
    metricDate: '2024-01-20',
    views: 3000,
    watchTimeMinutes: 200,
    likes: 150,
    comments: 30,
    subscribersGained: 20,
    subscribersLost: 1,
    averageViewDuration: 40,
    thumbnailUrl: '',
  },
  {
    videoId: 'v3',
    title: 'Third Video',
    publishedAt: '2024-01-17',
    metricDate: '2024-01-20',
    views: 8000,
    watchTimeMinutes: 500,
    likes: 400,
    comments: 80,
    subscribersGained: 50,
    subscribersLost: 3,
    averageViewDuration: 37.5,
    thumbnailUrl: 'http://example.com/3.jpg',
  },
];

describe('VideoPerformanceTable', () => {
  it('renders video records', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
    expect(screen.getByText('Third Video')).toBeInTheDocument();
  });

  it('displays view counts', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('3,000')).toBeInTheDocument();
    expect(screen.getByText('8,000')).toBeInTheDocument();
  });

  it('filters by title', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    const input = screen.getByPlaceholderText('Filter by title or video ID...');
    fireEvent.change(input, { target: { value: 'First' } });

    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.queryByText('Second Video')).not.toBeInTheDocument();
  });

  it('filters by video ID', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    const input = screen.getByPlaceholderText('Filter by title or video ID...');
    fireEvent.change(input, { target: { value: 'v2' } });

    expect(screen.getByText('Second Video')).toBeInTheDocument();
    expect(screen.queryByText('First Video')).not.toBeInTheDocument();
  });

  it('sorts by views descending by default', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    const rows = screen.getAllByRole('row');
    // Skip header row
    expect(rows[1]).toHaveTextContent('Third Video');
    expect(rows[2]).toHaveTextContent('First Video');
    expect(rows[3]).toHaveTextContent('Second Video');
  });

  it('sorts by likes when clicked', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    const likesHeader = screen.getByText('Likes');
    fireEvent.click(likesHeader);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Third Video'); // 400 likes
    expect(rows[2]).toHaveTextContent('First Video'); // 250 likes
    expect(rows[3]).toHaveTextContent('Second Video'); // 150 likes
  });

  it('toggles sort direction', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    const viewsHeader = screen.getByText('Views');
    fireEvent.click(viewsHeader); // Already sorted by views desc
    fireEvent.click(viewsHeader); // Toggle to asc

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Second Video'); // 3000 views
    expect(rows[2]).toHaveTextContent('First Video'); // 5000 views
    expect(rows[3]).toHaveTextContent('Third Video'); // 8000 views
  });

  it('shows empty state when no matches', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    const input = screen.getByPlaceholderText('Filter by title or video ID...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No videos match your filter')).toBeInTheDocument();
  });

  it('displays video count', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    expect(screen.getByText('3 videos')).toBeInTheDocument();
  });

  it('renders thumbnails when available', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    // Check that thumbnail URLs are present in the document
    expect(screen.getByText('First Video').closest('tr')).toContainHTML('example.com/1.jpg');
    expect(screen.getByText('Third Video').closest('tr')).toContainHTML('example.com/3.jpg');
  });

  it('renders placeholder when no thumbnail', () => {
    render(<VideoPerformanceTable records={mockRecords} />);
    // v2 has no thumbnail, should show placeholder with Eye icon
    expect(screen.getByText('Second Video')).toBeInTheDocument();
  });
});
