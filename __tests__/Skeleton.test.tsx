import { render } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from '../app/components/Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('animate-pulse', 'bg-gray-200', 'dark:bg-gray-700', 'rounded');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-1/2" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('h-10', 'w-1/2');
  });
});

describe('SkeletonCard', () => {
  it('renders five skeleton elements (card wrapper + 4 inner)', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(5);
  });

  it('has card wrapper classes', () => {
    const { container } = render(<SkeletonCard />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('rounded-xl', 'p-6');
  });
});

describe('SkeletonList', () => {
  it('renders default 3 rows', () => {
    const { container } = render(<SkeletonList />);
    const rows = container.querySelectorAll('.flex.items-center');
    expect(rows.length).toBe(3);
  });

  it('renders specified number of rows', () => {
    const { container } = render(<SkeletonList rows={5} />);
    const rows = container.querySelectorAll('.flex.items-center');
    expect(rows.length).toBe(5);
  });

  it('renders border on non-last rows', () => {
    const { container } = render(<SkeletonList rows={3} />);
    const rows = container.querySelectorAll('.border-b');
    expect(rows.length).toBe(2);
  });

  it('renders no border on last row', () => {
    const { container } = render(<SkeletonList rows={1} />);
    const rows = container.querySelectorAll('.border-b');
    expect(rows.length).toBe(0);
  });
});

describe('SkeletonTable', () => {
  it('renders default 3 rows', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.px-6');
    expect(rows.length).toBe(3);
  });

  it('renders specified number of rows', () => {
    const { container } = render(<SkeletonTable rows={4} />);
    const rows = container.querySelectorAll('.px-6');
    expect(rows.length).toBe(4);
  });
});
