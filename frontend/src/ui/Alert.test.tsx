import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('should render alert with message', () => {
    render(<Alert message="Test message" />);

    const alert = screen.getByText('Test message');
    expect(alert).toBeInTheDocument();
  });

  it('should render alert with title and message', () => {
    render(<Alert title="Alert Title" message="Alert message" />);

    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('should apply info variant by default', () => {
    const { container } = render(<Alert message="Info message" />);

    const alert = container.querySelector('.bg-indigo-900\\/60');
    expect(alert).toBeInTheDocument();
  });

  it('should apply success variant', () => {
    const { container } = render(<Alert message="Success" variant="success" />);

    const alert = container.querySelector('.bg-green-900\\/60');
    expect(alert).toBeInTheDocument();
  });

  it('should apply warning variant', () => {
    const { container } = render(<Alert message="Warning" variant="warning" />);

    const alert = container.querySelector('.bg-yellow-900\\/60');
    expect(alert).toBeInTheDocument();
  });

  it('should apply error variant', () => {
    const { container } = render(<Alert message="Error" variant="error" />);

    const alert = container.querySelector('.bg-red-900\\/60');
    expect(alert).toBeInTheDocument();
  });

  it('should render close button when onClose is provided', () => {
    const handleClose = vi.fn();
    render(<Alert message="Test" onClose={handleClose} />);

    const closeButton = screen.getByText('×');
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Alert message="Test" onClose={handleClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(<Alert message="Test" />);

    const closeButton = screen.queryByText('×');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Alert message="Test" className="mt-8" />);

    const alert = container.querySelector('.mt-8');
    expect(alert).toBeInTheDocument();
  });
});
