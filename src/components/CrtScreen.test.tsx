import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CrtScreen from './CrtScreen';

describe('CrtScreen', () => {
  it('renders the screenshot at 320x240, lazy by default', () => {
    render(<CrtScreen src="/a.png" alt="Second Reality" />);
    const img = screen.getByAltText('Second Reality');
    expect(img).toHaveAttribute('width', '320');
    expect(img).toHaveAttribute('height', '240');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('src', '/a.png');
  });

  it('takes the size and loading it is given', () => {
    const { container } = render(<CrtScreen src="/a.png" alt="x" size="large" loading="eager" />);
    expect(container.querySelector('.crt')).toHaveClass('crt--large');
    expect(screen.getByAltText('x')).toHaveAttribute('loading', 'eager');
  });

  it('renders the frame but no image without a src', () => {
    const { container } = render(<CrtScreen src={undefined} alt="x" />);
    expect(container.querySelector('.crt')).toHaveClass('crt--medium');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
