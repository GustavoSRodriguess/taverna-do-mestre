import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render button with label', () => {
    render(<Button buttonLabel="Click Me" onClick={vi.fn()} />);

    const button = screen.getByText('Click Me');
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button buttonLabel="Click Me" onClick={handleClick} />);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button buttonLabel="Click Me" onClick={handleClick} disabled />);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button buttonLabel="Test" onClick={vi.fn()} classname="custom-class" />);

    const button = screen.getByText('Test');
    expect(button).toHaveClass('custom-class');
  });

  it('should have disabled attribute when disabled prop is true', () => {
    render(<Button buttonLabel="Test" onClick={vi.fn()} disabled />);

    const button = screen.getByText('Test');
    expect(button).toBeDisabled();
  });

  it('should apply type attribute', () => {
    render(<Button buttonLabel="Submit" onClick={vi.fn()} type="submit" />);

    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should default to button type', () => {
    render(<Button buttonLabel="Test" onClick={vi.fn()} />);

    const button = screen.getByText('Test');
    expect(button).toHaveAttribute('type', 'button');
  });
});
