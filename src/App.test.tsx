/**
 * Tests for App component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock DosPlayer component
vi.mock('./components/DosPlayer', () => ({
  DosPlayer: ({ onReady, onExit }: { onReady?: () => void; onExit?: () => void }) => (
    <div data-testid="dos-player-mock">
      <button onClick={onReady}>Trigger Ready</button>
      <button onClick={onExit}>Trigger Exit</button>
    </div>
  ),
}));

describe('App', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<App />);
      expect(screen.getByText('DosKit')).toBeInTheDocument();
    });

    it('should render header with logo', () => {
      render(<App />);
      const logo = screen.getByAltText('DosKit Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logo.svg');
    });

    it('should render DosPlayer component', () => {
      render(<App />);
      expect(screen.getByTestId('dos-player-mock')).toBeInTheDocument();
    });
  });

  describe('Status display', () => {
    it('should show loading status initially', () => {
      render(<App />);
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      expect(screen.getByText(/Initializing DOS environment/i)).toBeInTheDocument();
    });

    it('should have status display elements', () => {
      render(<App />);

      // Check that status elements exist
      const statusBadge = screen.getByText(/Loading/i);
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('status-badge');
    });
  });

  describe('Footer', () => {
    it('should render credits', () => {
      render(<App />);
      expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
      expect(screen.getByText(/js-dos v8.3.20/i)).toBeInTheDocument();
    });

    it('should render author attribution', () => {
      render(<App />);
      expect(screen.getByText(/Made with/i)).toBeInTheDocument();
      expect(screen.getByText(/Cameron Rye/i)).toBeInTheDocument();
    });

    it('should have correct links', () => {
      render(<App />);
      
      const authorLink = screen.getByRole('link', { name: /Cameron Rye/i });
      expect(authorLink).toHaveAttribute('href', 'https://rye.dev/');
      expect(authorLink).toHaveAttribute('target', '_blank');
      expect(authorLink).toHaveAttribute('rel', 'noopener noreferrer');
      
      const jsDosLink = screen.getByRole('link', { name: /js-dos v8.3.20/i });
      expect(jsDosLink).toHaveAttribute('href', 'https://js-dos.com');
      expect(jsDosLink).toHaveAttribute('target', '_blank');
      expect(jsDosLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Layout', () => {
    it('should have correct structure', () => {
      const { container } = render(<App />);
      
      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(container.querySelector('.app-header')).toBeInTheDocument();
      expect(container.querySelector('.app-main')).toBeInTheDocument();
      expect(container.querySelector('.app-footer')).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      const { container } = render(<App />);
      
      const header = container.querySelector('.app-header');
      expect(header).toBeInTheDocument();
      
      const main = container.querySelector('.app-main');
      expect(main).toBeInTheDocument();
      
      const footer = container.querySelector('.app-footer');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<App />);
      const heading = screen.getByRole('heading', { name: 'DosKit' });
      expect(heading.tagName).toBe('H1');
    });

    it('should have alt text for images', () => {
      render(<App />);
      const logo = screen.getByAltText('DosKit Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should have proper link attributes for security', () => {
      render(<App />);
      const links = screen.getAllByRole('link');
      
      links.forEach((link) => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    });
  });
});

