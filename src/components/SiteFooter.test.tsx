import { render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { version as installedJsDosVersion } from 'js-dos/package.json';
import SiteFooter from './SiteFooter';

describe('SiteFooter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders credits with the installed js-dos version', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    expect(screen.getByText(`js-dos v${installedJsDosVersion}`)).toBeInTheDocument();
  });

  it('shows the js-dos version the build provides', () => {
    vi.stubEnv('VITE_JSDOS_VERSION', '9.9.9');
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'js-dos v9.9.9' })).toBeInTheDocument();
  });

  it('renders author attribution', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/Made by/i)).toBeInTheDocument();
    expect(screen.getByText(/Cameron Rye/i)).toBeInTheDocument();
  });

  it('has the three links, each in a new tab', () => {
    render(<SiteFooter />);
    const links = [
      [screen.getByRole('link', { name: /Cameron Rye/i }), 'https://rye.dev/'],
      [
        screen.getByRole('link', { name: `js-dos v${installedJsDosVersion}` }),
        'https://js-dos.com',
      ],
      [screen.getByRole('link', { name: 'Licenses' }), '/licenses/'],
    ] as const;
    for (const [link, href] of links) {
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('takes a class name', () => {
    const { container } = render(<SiteFooter className="x" />);
    expect(container.querySelector('footer')).toHaveClass('site-footer', 'x');
  });
});
