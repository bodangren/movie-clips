import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogViewer } from './LogViewer';

describe('LogViewer', () => {
  const mockLogs = [
    {
      timestamp: new Date('2025-01-01T10:00:00'),
      level: 'info' as const,
      message: 'Starting pipeline',
    },
    {
      timestamp: new Date('2025-01-01T10:00:01'),
      level: 'info' as const,
      message: 'Analyzing video',
    },
    { timestamp: new Date('2025-01-01T10:00:02'), level: 'warn' as const, message: 'Low memory' },
    {
      timestamp: new Date('2025-01-01T10:00:03'),
      level: 'error' as const,
      message: 'Failed to process',
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T10:00:05'));
  });

  it('renders log entries', () => {
    render(<LogViewer logs={mockLogs} />);
    expect(screen.getByText('Starting pipeline')).toBeInTheDocument();
    expect(screen.getByText('Analyzing video')).toBeInTheDocument();
  });

  it('renders info level logs with blue indicator', () => {
    render(<LogViewer logs={mockLogs} />);
    const infoLog = screen.getByText('Starting pipeline').closest('.log-entry');
    expect(infoLog).toHaveClass('border-l-blue-500');
  });

  it('renders warn level logs with yellow indicator', () => {
    render(<LogViewer logs={mockLogs} />);
    const warnLog = screen.getByText('Low memory').closest('.log-entry');
    expect(warnLog).toHaveClass('border-l-yellow-500');
  });

  it('renders error level logs with red indicator', () => {
    render(<LogViewer logs={mockLogs} />);
    const errorLog = screen.getByText('Failed to process').closest('.log-entry');
    expect(errorLog).toHaveClass('border-l-red-500');
  });

  it('shows timestamp when showTimestamp is true', () => {
    render(<LogViewer logs={mockLogs} showTimestamp />);
    expect(screen.getByText('10:00:00')).toBeInTheDocument();
  });

  it('filters logs by level when filter is set', () => {
    render(<LogViewer logs={mockLogs} filter="error" />);
    expect(screen.getByText('Failed to process')).toBeInTheDocument();
    expect(screen.queryByText('Starting pipeline')).not.toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText('No logs yet')).toBeInTheDocument();
  });

  it('has auto-scroll button when autoScroll is true', () => {
    render(<LogViewer logs={mockLogs} autoScroll />);
    const scrollButton = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(scrollButton).toBeInTheDocument();
  });

  it('clears logs when clear button is clicked', () => {
    const handleClear = vi.fn();
    render(<LogViewer logs={mockLogs} onClear={handleClear} />);
    fireEvent.click(screen.getByRole('button', { name: /clear logs/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<LogViewer logs={mockLogs} className="custom-class" />);
    const viewer = screen.getByTestId('log-viewer').parentElement;
    expect(viewer).toHaveClass('custom-class');
  });
});
