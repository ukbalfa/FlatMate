/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../app/components/EmptyState';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, any>) => <div {...props}>{children}</div>,
  },
}));

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No items"
        description="Add something to get started"
      />
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add something to get started')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Add something"
        icon={<span data-testid="test-icon">Icon</span>}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders emoji when provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Add something"
        emoji="📭"
      />
    );
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('prefers icon over emoji when both are provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Add something"
        icon={<span data-testid="test-icon">Icon</span>}
        emoji="📭"
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.queryByText('📭')).not.toBeInTheDocument();
  });

  it('renders link button when action has href', () => {
    render(
      <EmptyState
        title="No items"
        description="Add something"
        action={{ label: 'Go to page', href: '/dashboard' }}
      />
    );
    const link = screen.getByRole('link', { name: 'Go to page' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders button with onClick when action has no href', () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        title="No items"
        description="Add something"
        action={{ label: 'Click me', onClick }}
      />
    );
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Add something"
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls onClick when action button is clicked', () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        title="No items"
        description="Add something"
        action={{ label: 'Click me', onClick }}
      />
    );
    screen.getByRole('button', { name: 'Click me' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
