import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders children when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <Modal.Content>Modal content</Modal.Content>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Hidden content</div>
      </Modal>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Modal Title">
        <Modal.Content>Content</Modal.Content>
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Modal Title">
        <Modal.Content>Content</Modal.Content>
      </Modal>
    );
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        <Modal.Content>Content</Modal.Content>
      </Modal>
    );
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when content is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        <Modal.Content>Content</Modal.Content>
      </Modal>
    );
    const content = screen.getByText('Content');
    fireEvent.click(content);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <Modal.Content>Content</Modal.Content>
        <Modal.Footer>Footer content</Modal.Footer>
      </Modal>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('closes on escape key when open', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        <Modal.Content>Content</Modal.Content>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
