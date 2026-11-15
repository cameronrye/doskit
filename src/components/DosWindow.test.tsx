import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DosWindow from './DosWindow';

describe('DosWindow', () => {
  it('puts the title in the border with the given id, for aria-labelledby', () => {
    render(
      <DosWindow as="section" title="About" titleId="about-title">
        <p>Body</p>
      </DosWindow>
    );
    expect(screen.getByText('About')).toHaveAttribute('id', 'about-title');
  });

  it('uses the element named by as, and div by default', () => {
    const { container, rerender } = render(<DosWindow as="aside">x</DosWindow>);
    expect(container.firstElementChild?.tagName).toBe('ASIDE');
    expect(container.firstElementChild).toHaveClass('dos-window');
    rerender(<DosWindow className="extra">x</DosWindow>);
    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(container.firstElementChild).toHaveClass('dos-window', 'extra');
    expect(container.querySelector('.dos-window-frame')).toHaveTextContent('x');
  });
});
