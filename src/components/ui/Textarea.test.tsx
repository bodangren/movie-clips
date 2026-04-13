import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter description..." />);
    expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<Textarea value="test value" onChange={() => {}} />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('handles change events', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays label when provided', () => {
    render(<Textarea label="Description" placeholder="Enter..." />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<Textarea error="This field is required" placeholder="Enter..." />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('has error styling when error is present', () => {
    render(<Textarea error="Error" placeholder="Enter..." />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-destructive');
  });

  it('forwards className', () => {
    render(<Textarea className="custom-class" placeholder="Enter..." />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  it('forwards ref to textarea element', () => {
    let refValue: HTMLTextAreaElement | null = null;
    render(
      <Textarea
        ref={el => {
          refValue = el;
        }}
        placeholder="Enter..."
      />
    );
    expect(refValue).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Textarea disabled placeholder="Enter..." />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });
});
