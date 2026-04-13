import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

describe('Select', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  it('renders with placeholder', () => {
    render(<Select placeholder="Select an option..." options={options} onChange={() => {}} />);
    expect(screen.getByText('Select an option...')).toBeInTheDocument();
  });

  it('renders options correctly', () => {
    render(<Select options={options} onChange={() => {}} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const handleChange = vi.fn();
    render(<Select options={options} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('displays label when provided', () => {
    render(<Select label="Choose one" options={options} onChange={() => {}} />);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<Select error="Required" options={options} onChange={() => {}} />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('has error styling when error is present', () => {
    render(<Select error="Error" options={options} onChange={() => {}} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-destructive');
  });

  it('forwards className', () => {
    render(<Select className="custom-class" options={options} onChange={() => {}} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select disabled options={options} onChange={() => {}} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });
});
