import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from './StatusIndicator';
import type { PipelineStatus } from '@/stores/pipeline.store';

describe('StatusIndicator', () => {
  const statuses: PipelineStatus[] = ['idle', 'running', 'completed', 'failed', 'paused'];

  statuses.forEach(status => {
    it(`renders ${status} status`, () => {
      render(<StatusIndicator status={status} />);
      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveAttribute('data-status', status);
    });
  });

  it('renders idle status with gray color', () => {
    render(<StatusIndicator status="idle" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-muted');
  });

  it('renders running status with blue color and animation', () => {
    render(<StatusIndicator status="running" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-blue-500', 'animate-pulse');
  });

  it('renders completed status with green color', () => {
    render(<StatusIndicator status="completed" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-green-500');
  });

  it('renders failed status with red color', () => {
    render(<StatusIndicator status="failed" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-red-500');
  });

  it('renders paused status with yellow color', () => {
    render(<StatusIndicator status="paused" />);
    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-yellow-500');
  });

  it('renders label when showLabel is true', () => {
    render(<StatusIndicator status="running" showLabel />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<StatusIndicator status="idle" className="custom-class" />);
    const indicator = screen.getByTestId('status-indicator').parentElement;
    expect(indicator).toHaveClass('custom-class');
  });
});
