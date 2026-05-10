import { render, screen } from '@testing-library/react';
import PrimaryButton from '../components/ui/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders children text', () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a button by default', () => {
    render(<PrimaryButton>Click me</PrimaryButton>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('renders as a link when href is provided', () => {
    render(<PrimaryButton href="/dashboard">Go to Dashboard</PrimaryButton>);
    const link = screen.getByRole('link', { name: 'Go to Dashboard' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('applies gradient-citrus class for styling', () => {
    render(<PrimaryButton>Styled</PrimaryButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('gradient-citrus');
  });

  it('merges custom className with base classes', () => {
    render(<PrimaryButton className="custom-class">Custom</PrimaryButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('gradient-citrus');
    expect(button.className).toContain('custom-class');
  });

  it('passes additional props to button element', () => {
    render(<PrimaryButton disabled>Disabled</PrimaryButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders link with href when provided', () => {
    render(<PrimaryButton href="/test">Link</PrimaryButton>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });
});
