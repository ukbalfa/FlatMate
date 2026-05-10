import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../app/components/ErrorBoundary';

const SomethingThrow = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working content</div>;
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Working content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Working content')).toBeInTheDocument();
  });

  it('renders default error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <SomethingThrow shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <SomethingThrow shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('resets error state when Try again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <SomethingThrow shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Toggle the throw condition BEFORE clicking reset
    rerender(
      <ErrorBoundary>
        <SomethingThrow shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Working content')).toBeInTheDocument();
  });
});
