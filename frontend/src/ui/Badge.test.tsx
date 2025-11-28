import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should render badge with text', () => {
    render(<Badge text="Active" />);

    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    render(<Badge text="Test" />);

    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('bg-purple-600');
  });

  it('should apply success variant', () => {
    render(<Badge text="Success" variant="success" />);

    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-600');
  });

  it('should apply warning variant', () => {
    render(<Badge text="Warning" variant="warning" />);

    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-500');
  });

  it('should apply danger variant', () => {
    render(<Badge text="Danger" variant="danger" />);

    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-red-600');
  });

  it('should apply info variant', () => {
    render(<Badge text="Info" variant="info" />);

    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-600');
  });

  it('should apply custom className', () => {
    render(<Badge text="Custom" className="ml-4" />);

    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('ml-4');
  });
});
