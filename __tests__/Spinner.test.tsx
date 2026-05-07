import { render } from '@testing-library/react';
import { Spinner } from '../app/components/Spinner';

describe('Spinner', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has animate-spin class for animation', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('uses default className when not provided', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<Spinner className="w-8 h-8 text-blue-500" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8', 'text-blue-500');
  });

  it('has aria-hidden attribute for accessibility', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a circle element inside', () => {
    const { container } = render(<Spinner />);
    const circle = container.querySelector('svg circle');
    expect(circle).toBeInTheDocument();
  });

  it('renders a path element inside', () => {
    const { container } = render(<Spinner />);
    const path = container.querySelector('svg path');
    expect(path).toBeInTheDocument();
  });

  it('does not render any text content', () => {
    const { container } = render(<Spinner />);
    expect(container.textContent).toBe('');
  });
});
