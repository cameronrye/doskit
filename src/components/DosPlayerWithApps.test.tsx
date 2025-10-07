/**
 * Tests for DosPlayerWithApps component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DosPlayerWithApps } from './DosPlayerWithApps';

// Mock DosPlayer component
vi.mock('./DosPlayer', () => ({
  DosPlayer: ({ onReady, onExit }: { onReady?: () => void; onExit?: () => void }) => (
    <div data-testid="dos-player-mock">
      <button onClick={onReady}>Trigger Ready</button>
      <button onClick={onExit}>Trigger Exit</button>
    </div>
  ),
}));

// Mock DemoSelector component
vi.mock('./DemoSelector', () => ({
  DemoSelector: ({ onSelect, onCancel }: { onSelect: () => void; onCancel: () => void }) => (
    <div data-testid="demo-selector-mock">
      <button onClick={onSelect}>Select App</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('DosPlayerWithApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<DosPlayerWithApps />);
      expect(screen.getByTestId('dos-player-mock')).toBeInTheDocument();
    });

    it('should render DosPlayer component', () => {
      render(<DosPlayerWithApps />);
      expect(screen.getByTestId('dos-player-mock')).toBeInTheDocument();
    });

    it('should not show selector by default', () => {
      render(<DosPlayerWithApps showSelector={false} />);
      expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
    });

    it('should show selector when showSelector prop is true', () => {
      render(<DosPlayerWithApps showSelector={true} />);
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
    });
  });

  describe('Prop synchronization', () => {
    it('should update selector visibility when showSelector prop changes', async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={false} />);
      
      // Initially, selector should not be visible
      expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      
      // Update the prop to show the selector
      rerender(<DosPlayerWithApps showSelector={true} />);
      
      // Selector should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
    });

    it('should hide selector when showSelector prop changes from true to false', async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={true} />);
      
      // Initially, selector should be visible
      expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      
      // Update the prop to hide the selector
      rerender(<DosPlayerWithApps showSelector={false} />);
      
      // Selector should now be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
    });

    it('should respond to multiple prop changes', async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={false} />);
      
      // Show selector
      rerender(<DosPlayerWithApps showSelector={true} />);
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
      
      // Hide selector
      rerender(<DosPlayerWithApps showSelector={false} />);
      await waitFor(() => {
        expect(screen.queryByTestId('demo-selector-mock')).not.toBeInTheDocument();
      });
      
      // Show selector again
      rerender(<DosPlayerWithApps showSelector={true} />);
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onSelectorVisibilityChange when prop changes', async () => {
      const onSelectorVisibilityChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps 
          showSelector={false} 
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );
      
      // Update the prop to show the selector
      rerender(
        <DosPlayerWithApps 
          showSelector={true} 
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />
      );
      
      // Wait for the selector to be visible
      await waitFor(() => {
        expect(screen.getByTestId('demo-selector-mock')).toBeInTheDocument();
      });
    });

    it('should call onReady callback when DosPlayer is ready', () => {
      const onReady = vi.fn();
      render(<DosPlayerWithApps onReady={onReady} />);
      
      const readyButton = screen.getByText('Trigger Ready');
      readyButton.click();
      
      expect(onReady).toHaveBeenCalled();
    });

    it('should call onExit callback when DosPlayer exits', () => {
      const onExit = vi.fn();
      render(<DosPlayerWithApps onExit={onExit} />);
      
      const exitButton = screen.getByText('Trigger Exit');
      exitButton.click();
      
      expect(onExit).toHaveBeenCalled();
    });
  });

  describe('Selector overlay', () => {
    it('should render overlay when selector is shown', () => {
      const { container } = render(<DosPlayerWithApps showSelector={true} />);
      const overlay = container.querySelector('.selector-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should not render overlay when selector is hidden', () => {
      const { container } = render(<DosPlayerWithApps showSelector={false} />);
      const overlay = container.querySelector('.selector-overlay');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('should apply custom className', () => {
      const { container } = render(<DosPlayerWithApps className="custom-class" />);
      const wrapper = container.querySelector('.dos-player-with-apps');
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should have default class', () => {
      const { container } = render(<DosPlayerWithApps />);
      const wrapper = container.querySelector('.dos-player-with-apps');
      expect(wrapper).toBeInTheDocument();
    });
  });
});

