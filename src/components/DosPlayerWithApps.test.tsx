/**
 * Tests for DosPlayerWithApps component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DosPlayerWithApps } from "./DosPlayerWithApps";
import type { DosApp } from "../types/dos-app";
import type { LoadedApp } from "./DemoSelector";

// Type definitions for test mocks
interface DemoSelectorProps {
  onSelect: (loadedApp: LoadedApp) => void;
  onCancel: () => void;
}

interface WindowWithMockApp extends Window {
  __mockApp?: DosApp;
  __mockLoadedApp?: LoadedApp;
}

// Create a mock app
const mockApp: DosApp = {
  id: "test-app",
  name: "Test App",
  description: "A test application",
  author: "Test Author",
  year: 2024,
  loadMethod: "zip",
  dosboxConf: "[cpu]\ncore=auto",
  loader: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
};

const mockLoadedApp: LoadedApp = {
  app: mockApp,
  files: new Uint8Array([1, 2, 3]),
  dosboxConf: "[cpu]\ncore=auto",
};

const mockAppWithError: DosApp = {
  ...mockApp,
  id: "error-app",
  loader: vi.fn().mockRejectedValue(new Error("Failed to load")),
};

// Mock DosPlayer component
vi.mock("./DosPlayer", () => ({
  DosPlayer: ({
    onReady,
    onExit,
  }: {
    onReady?: () => void;
    onExit?: () => void;
  }) => (
    <div data-testid="dos-player-mock">
      <button onClick={onReady}>Trigger Ready</button>
      <button onClick={onExit}>Trigger Exit</button>
    </div>
  ),
}));

// Mock DemoSelector component
vi.mock("./DemoSelector", () => ({
  DemoSelector: ({ onSelect, onCancel }: DemoSelectorProps) => (
    <div data-testid="demo-selector-mock">
      <button
        onClick={() => onSelect((window as WindowWithMockApp).__mockLoadedApp!)}
      >
        Select App
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe("DosPlayerWithApps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Store mock app and loaded app in window for the mock selector to use
    (window as WindowWithMockApp).__mockApp = mockApp;
    (window as WindowWithMockApp).__mockLoadedApp = mockLoadedApp;
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(<DosPlayerWithApps />);
      expect(screen.getByTestId("dos-player-mock")).toBeInTheDocument();
    });

    it("should render DosPlayer component", () => {
      render(<DosPlayerWithApps />);
      expect(screen.getByTestId("dos-player-mock")).toBeInTheDocument();
    });

    it("should not show selector by default", () => {
      render(<DosPlayerWithApps showSelector={false} />);
      expect(
        screen.queryByTestId("demo-selector-mock"),
      ).not.toBeInTheDocument();
    });

    it("should show selector when showSelector prop is true", () => {
      render(<DosPlayerWithApps showSelector={true} />);
      expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();
    });
  });

  describe("Prop synchronization", () => {
    it("should update selector visibility when showSelector prop changes", async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={false} />);

      // Initially, selector should not be visible
      expect(
        screen.queryByTestId("demo-selector-mock"),
      ).not.toBeInTheDocument();

      // Update the prop to show the selector
      rerender(<DosPlayerWithApps showSelector={true} />);

      // Selector should now be visible
      await waitFor(() => {
        expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();
      });
    });

    it("should hide selector when showSelector prop changes from true to false", async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={true} />);

      // Initially, selector should be visible
      expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();

      // Update the prop to hide the selector
      rerender(<DosPlayerWithApps showSelector={false} />);

      // Selector should now be hidden
      await waitFor(() => {
        expect(
          screen.queryByTestId("demo-selector-mock"),
        ).not.toBeInTheDocument();
      });
    });

    it("should respond to multiple prop changes", async () => {
      const { rerender } = render(<DosPlayerWithApps showSelector={false} />);

      // Show selector
      rerender(<DosPlayerWithApps showSelector={true} />);
      await waitFor(() => {
        expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();
      });

      // Hide selector
      rerender(<DosPlayerWithApps showSelector={false} />);
      await waitFor(() => {
        expect(
          screen.queryByTestId("demo-selector-mock"),
        ).not.toBeInTheDocument();
      });

      // Show selector again
      rerender(<DosPlayerWithApps showSelector={true} />);
      await waitFor(() => {
        expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();
      });
    });
  });

  describe("Callbacks", () => {
    it("should call onSelectorVisibilityChange when prop changes", async () => {
      const onSelectorVisibilityChange = vi.fn();
      const { rerender } = render(
        <DosPlayerWithApps
          showSelector={false}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />,
      );

      // Update the prop to show the selector
      rerender(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />,
      );

      // Wait for the selector to be visible
      await waitFor(() => {
        expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();
      });
    });

    it("should call onReady callback when DosPlayer is ready", () => {
      const onReady = vi.fn();
      render(<DosPlayerWithApps onReady={onReady} />);

      const readyButton = screen.getByText("Trigger Ready");
      readyButton.click();

      expect(onReady).toHaveBeenCalled();
    });

    it("should call onExit callback when DosPlayer exits", () => {
      const onExit = vi.fn();
      render(<DosPlayerWithApps onExit={onExit} />);

      const exitButton = screen.getByText("Trigger Exit");
      exitButton.click();

      expect(onExit).toHaveBeenCalled();
    });
  });

  describe("Selector overlay", () => {
    it("should render overlay when selector is shown", () => {
      const { container } = render(<DosPlayerWithApps showSelector={true} />);
      const overlay = container.querySelector(".selector-overlay");
      expect(overlay).toBeInTheDocument();
    });

    it("should not render overlay when selector is hidden", () => {
      const { container } = render(<DosPlayerWithApps showSelector={false} />);
      const overlay = container.querySelector(".selector-overlay");
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe("CSS classes", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <DosPlayerWithApps className="custom-class" />,
      );
      const wrapper = container.querySelector(".dos-player-with-apps");
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should have default class", () => {
      const { container } = render(<DosPlayerWithApps />);
      const wrapper = container.querySelector(".dos-player-with-apps");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Overlay click handling", () => {
    it("should close selector when overlay is clicked", async () => {
      const { container } = render(<DosPlayerWithApps showSelector={true} />);
      const overlay = container.querySelector(".selector-overlay");

      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(
          screen.queryByTestId("demo-selector-mock"),
        ).not.toBeInTheDocument();
      });
    });

    it("should call onSelectorVisibilityChange when overlay is clicked", async () => {
      const onSelectorVisibilityChange = vi.fn();
      const { container } = render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />,
      );

      const overlay = container.querySelector(".selector-overlay");
      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("App selection and loading", () => {
    it("should accept loaded app from DemoSelector", async () => {
      render(<DosPlayerWithApps showSelector={true} />);

      const selectButton = screen.getByText("Select App");
      fireEvent.click(selectButton);

      await waitFor(() => {
        // The mock DemoSelector passes the loaded app directly, so no loader call here
        expect(
          screen.queryByTestId("demo-selector-mock"),
        ).not.toBeInTheDocument();
      });
    });

    it("should hide selector after app is loaded", async () => {
      render(<DosPlayerWithApps showSelector={true} />);

      const selectButton = screen.getByText("Select App");
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("demo-selector-mock"),
        ).not.toBeInTheDocument();
      });
    });

    it("should call onAppChange when app is loaded", async () => {
      const onAppChange = vi.fn();
      render(
        <DosPlayerWithApps showSelector={true} onAppChange={onAppChange} />,
      );

      const selectButton = screen.getByText("Select App");
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onAppChange).toHaveBeenCalledWith(mockApp);
      });
    });

    it("should call onSelectorVisibilityChange when app is loaded", async () => {
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />,
      );

      const selectButton = screen.getByText("Select App");
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(false);
      });
    });

    it("should show loading overlay while loading app", async () => {
      const slowLoader = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  files: [
                    { path: "/test.exe", content: new Uint8Array([1, 2, 3]) },
                  ],
                  dosboxConf: "",
                }),
              100,
            ),
          ),
      );
      const slowApp = { ...mockApp, loader: slowLoader };

      render(<DosPlayerWithApps showSelector={false} />);

      // Dispatch load-app-from-url event to trigger the loader
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: slowApp },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(screen.getByText("Loading application...")).toBeInTheDocument();
      });
    });

    it("should handle app loading errors", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<DosPlayerWithApps showSelector={false} />);

      // Dispatch load-app-from-url event to trigger the error path
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: mockAppWithError },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(
          screen.getByText("Error Loading Application"),
        ).toBeInTheDocument();
        expect(screen.getByText("Failed to load")).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it("should handle non-Error exceptions during loading", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const appWithStringError: DosApp = {
        ...mockApp,
        loader: vi.fn().mockRejectedValue("String error"),
      };

      render(<DosPlayerWithApps showSelector={false} />);

      // Dispatch load-app-from-url event to trigger the error path
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: appWithStringError },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load application"),
        ).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it("should show Try Again button on error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(<DosPlayerWithApps showSelector={false} />);

      // Dispatch load-app-from-url event to trigger the error path
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: mockAppWithError },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Try Again/i }),
        ).toBeInTheDocument();
      });
    });

    it("should reset state when Try Again is clicked", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(<DosPlayerWithApps showSelector={false} />);

      // Dispatch load-app-from-url event to trigger the error path
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: mockAppWithError },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(
          screen.getByText("Error Loading Application"),
        ).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Error Loading Application"),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("demo-selector-mock")).toBeInTheDocument();
      });
    });

    it("should call onAppChange with null when reset", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const onAppChange = vi.fn();

      render(
        <DosPlayerWithApps showSelector={false} onAppChange={onAppChange} />,
      );

      // Dispatch load-app-from-url event to trigger the error path
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: mockAppWithError },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(
          screen.getByText("Error Loading Application"),
        ).toBeInTheDocument();
      });

      onAppChange.mockClear();

      const tryAgainButton = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(onAppChange).toHaveBeenCalledWith(null);
      });
    });

    it("should call onSelectorVisibilityChange with true when reset", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const onSelectorVisibilityChange = vi.fn();

      render(
        <DosPlayerWithApps
          showSelector={false}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />,
      );

      // Dispatch load-app-from-url event to trigger the error path
      const event = new CustomEvent("load-app-from-url", {
        detail: { app: mockAppWithError },
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(
          screen.getByText("Error Loading Application"),
        ).toBeInTheDocument();
      });

      onSelectorVisibilityChange.mockClear();

      const tryAgainButton = screen.getByRole("button", { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Cancel functionality", () => {
    it("should hide selector when Cancel is clicked", async () => {
      render(<DosPlayerWithApps showSelector={true} />);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("demo-selector-mock"),
        ).not.toBeInTheDocument();
      });
    });

    it("should call onSelectorVisibilityChange when Cancel is clicked", async () => {
      const onSelectorVisibilityChange = vi.fn();
      render(
        <DosPlayerWithApps
          showSelector={true}
          onSelectorVisibilityChange={onSelectorVisibilityChange}
        />,
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(onSelectorVisibilityChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
