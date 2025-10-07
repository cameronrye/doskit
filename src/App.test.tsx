/**
 * Tests for App component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import type { DosApp } from './components/DosPlayerWithApps';

// Create a mock app
const mockApp: DosApp = {
  id: 'test-app',
  name: 'Test Application',
  description: 'A test DOS application',
  author: 'Test Author',
  year: 1995,
  loadMethod: 'zip',
  dosboxConf: '[cpu]\ncore=auto',
  loader: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};

// Mock DosPlayerWithApps component
vi.mock('./components/DosPlayerWithApps', () => ({
  DosPlayerWithApps: ({
    onReady,
    onExit,
    onAppChange,
    onSelectorVisibilityChange,
    showSelector
  }: any) => {
    // Store callbacks in window for test access
    (window as any).__dosCallbacks = {
      onReady,
      onExit,
      onAppChange,
      onSelectorVisibilityChange,
    };

    return (
      <div data-testid="dos-player-with-apps-mock">
        <button onClick={onReady}>Trigger Ready</button>
        <button onClick={onExit}>Trigger Exit</button>
        <button onClick={() => onAppChange(mockApp)}>Load App</button>
        <button onClick={() => onAppChange(null)}>Clear App</button>
        <button onClick={() => onSelectorVisibilityChange(true)}>Show Selector</button>
        <button onClick={() => onSelectorVisibilityChange(false)}>Hide Selector</button>
        <div data-testid="selector-state">{showSelector ? 'visible' : 'hidden'}</div>
      </div>
    );
  },
}));

// Mock OfflineIndicator component
vi.mock('./components/OfflineIndicator', () => ({
  OfflineIndicator: ({ onNetworkStatusChange }: any) => {
    // Store callback in window for test access
    (window as any).__networkCallback = onNetworkStatusChange;

    return (
      <div data-testid="offline-indicator-mock">
        <button onClick={() => onNetworkStatusChange(false)}>Go Offline</button>
        <button onClick={() => onNetworkStatusChange(true)}>Go Online</button>
      </div>
    );
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear window callbacks
    delete (window as any).__dosCallbacks;
    delete (window as any).__networkCallback;
  });

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

    it('should render DosPlayerWithApps component', () => {
      render(<App />);
      expect(screen.getByTestId('dos-player-with-apps-mock')).toBeInTheDocument();
    });

    it('should render OfflineIndicator component', () => {
      render(<App />);
      expect(screen.getByTestId('offline-indicator-mock')).toBeInTheDocument();
    });

    it('should render Select Application button initially', () => {
      render(<App />);
      expect(screen.getByRole('button', { name: /Select Application/i })).toBeInTheDocument();
    });
  });

  describe('Status display', () => {
    it('should show loading status initially', () => {
      render(<App />);
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      const statusIndicators = document.querySelector('.status-indicators');
      expect(statusIndicators).toBeInTheDocument();
      expect(statusIndicators).toHaveTextContent(/Online/i);
    });

    it('should show ready status when DOS is ready', async () => {
      render(<App />);

      const readyButton = screen.getByText('Trigger Ready');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should show loading status when DOS exits', async () => {
      render(<App />);

      // First make it ready
      const readyButton = screen.getByText('Trigger Ready');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      // Then exit
      const exitButton = screen.getByText('Trigger Exit');
      fireEvent.click(exitButton);

      await waitFor(() => {
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      });
    });

    it('should show offline status when network goes offline', async () => {
      render(<App />);

      const offlineButton = screen.getByText('Go Offline');
      fireEvent.click(offlineButton);

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should show online status when network comes back online', async () => {
      render(<App />);

      // Go offline first
      const offlineButton = screen.getByText('Go Offline');
      fireEvent.click(offlineButton);

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });

      // Go back online
      const onlineButton = screen.getByText('Go Online');
      fireEvent.click(onlineButton);

      await waitFor(() => {
        const onlineStatuses = screen.getAllByText('Online');
        expect(onlineStatuses.length).toBeGreaterThan(0);
      });
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

  describe('Change Application Button', () => {
    it('should render the change application button', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('header-change-app-button');
    });

    it('should have correct button text when no app is selected', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });
      expect(button).toHaveTextContent('Select Application');
    });

    it('should be clickable and not disabled', () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });
      expect(button).not.toBeDisabled();

      // Verify the button can be clicked without errors
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should call handleChangeAppClick when clicked', async () => {
      render(<App />);
      const button = screen.getByRole('button', { name: /Select Application/i });

      fireEvent.click(button);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('visible');
      });
    });

    it('should change button text when app is loaded', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change Application/i })).toBeInTheDocument();
      });
    });

    it('should show app name in header when app is loaded', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByText('Test Application')).toBeInTheDocument();
      });
    });

    it('should show app metadata in header when app is loaded', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByText(/Test Author \(1995\)/i)).toBeInTheDocument();
      });
    });

    it('should hide app info when app is cleared', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByText('Test Application')).toBeInTheDocument();
      });

      const clearAppButton = screen.getByText('Clear App');
      fireEvent.click(clearAppButton);

      await waitFor(() => {
        expect(screen.queryByText('Test Application')).not.toBeInTheDocument();
      });
    });

    it('should revert button text when app is cleared', async () => {
      render(<App />);

      const loadAppButton = screen.getByText('Load App');
      fireEvent.click(loadAppButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change Application/i })).toBeInTheDocument();
      });

      const clearAppButton = screen.getByText('Clear App');
      fireEvent.click(clearAppButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Select Application/i })).toBeInTheDocument();
      });
    });
  });

  describe('Selector visibility management', () => {
    it('should update selector visibility when changed', async () => {
      render(<App />);

      const hideButton = screen.getByText('Hide Selector');
      fireEvent.click(hideButton);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('hidden');
      });
    });

    it('should show selector when visibility is set to true', async () => {
      render(<App />);

      const hideButton = screen.getByText('Hide Selector');
      fireEvent.click(hideButton);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('hidden');
      });

      const showButton = screen.getByText('Show Selector');
      fireEvent.click(showButton);

      await waitFor(() => {
        const selectorState = screen.getByTestId('selector-state');
        expect(selectorState).toHaveTextContent('visible');
      });
    });
  });
});

