import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('should render with default props', () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('should render with custom width', () => {
    const { container } = render(<LoadingSkeleton width="200px" />);
    const element = container.firstChild as HTMLElement;
    expect(element.style.width).toBe('200px');
  });

  it('should render with custom height', () => {
    const { container } = render(<LoadingSkeleton height="50px" />);
    const element = container.firstChild as HTMLElement;
    expect(element.style.height).toBe('50px');
  });

  it('should render circular skeleton', () => {
    const { container } = render(<LoadingSkeleton circle />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('should render multiple skeleton lines', () => {
    const { container } = render(<LoadingSkeleton count={3} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });
});
