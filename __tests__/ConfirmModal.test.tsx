/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../app/components/ConfirmModal';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, any>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('renders title and message when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('shows default confirm label', () => {
    render(<ConfirmModal {...defaultProps} />);
    const confirmButton = screen.getAllByRole('button')[1];
    expect(confirmButton).toHaveTextContent('Confirm');
  });

  it('shows custom confirm label when provided', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Delete Forever" />);
    const confirmButton = screen.getAllByRole('button')[1];
    expect(confirmButton).toHaveTextContent('Delete Forever');
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    const confirmButton = screen.getAllByRole('button')[1];
    fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    const cancelButton = screen.getAllByRole('button')[0];
    fireEvent.click(cancelButton);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('applies danger styling by default', () => {
    render(<ConfirmModal {...defaultProps} />);
    const confirmButton = screen.getAllByRole('button')[1];
    expect(confirmButton).toHaveClass('bg-red-500');
  });

  it('applies non-danger styling when danger is false', () => {
    render(<ConfirmModal {...defaultProps} danger={false} />);
    const confirmButton = screen.getAllByRole('button')[1];
    expect(confirmButton).toHaveClass('bg-[#F97316]');
    expect(confirmButton).not.toHaveClass('bg-red-500');
  });

  it('renders two buttons', () => {
    render(<ConfirmModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});
