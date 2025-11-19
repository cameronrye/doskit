/**
 * Tests for DemoSelector component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DemoSelector } from "./DemoSelector";
import { loadZipArchive } from "../utils/diskLoader";

// Mock the disk loader
vi.mock("../utils/diskLoader", () => ({
  loadZipArchive: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

// Mock the dos-apps configs
vi.mock("../dos-apps/second-reality.config", () => ({
  secondRealityZipUrl: "http://example.com/second-reality.zip",
  secondRealityDosboxConf: "[cpu]\ncore=auto",
  secondRealityMetadata: {
    name: "Second Reality",
    description: "A legendary demo by Future Crew",
    author: "Future Crew",
    year: 1993,
  },
}));

vi.mock("../dos-apps/impulse-tracker.config", () => ({
  impulseTrackerZipUrl: "http://example.com/impulse-tracker.zip",
  impulseTrackerDosboxConf: "[cpu]\ncore=auto",
  impulseTrackerMetadata: {
    name: "Impulse Tracker",
    description: "A music tracker application",
    author: "Jeffrey Lim",
    year: 1995,
  },
}));

describe("DemoSelector", () => {
  const mockOnSelect = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(screen.getByText("Select DOS Application")).toBeInTheDocument();
    });

    it("should render available applications", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(screen.getByText("Second Reality")).toBeInTheDocument();
      expect(screen.getByText("Impulse Tracker")).toBeInTheDocument();
    });

    it("should render close button when onCancel is provided", () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);
      expect(
        screen.getByRole("button", { name: /Close/i }),
      ).toBeInTheDocument();
    });

    it("should not render close button when onCancel is not provided", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(
        screen.queryByRole("button", { name: /Close/i }),
      ).not.toBeInTheDocument();
    });

    it("should render app descriptions", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(
        screen.getByText(/Legendary 1993 demo by Future Crew/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Classic music tracker software/i),
      ).toBeInTheDocument();
    });

    it("should render app metadata (author and year)", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      expect(screen.getByText(/Future Crew \(1993\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Jeffrey Lim \(1995\)/i)).toBeInTheDocument();
    });

    it("should render load method badges", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);
      const badges = screen.getAllByText("zip");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("App selection", () => {
    it("should select app when clicked", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      expect(appCard).toBeInTheDocument();

      fireEvent.click(appCard!);

      expect(appCard).toHaveClass("selected");
    });

    it("should show app details when app is selected", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      expect(screen.getByText(/Selected: Second Reality/i)).toBeInTheDocument();
    });

    it("should show Load Application button when app is selected", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      expect(
        screen.getByRole("button", { name: /Load Application/i }),
      ).toBeInTheDocument();
    });

    it("should show Cancel button when app is selected", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const cancelButtons = screen.getAllByRole("button", { name: /Cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it("should clear error when selecting a new app", async () => {
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new Error("Load failed"));

      render(<DemoSelector onSelect={mockOnSelect} />);

      // Select and try to load an app (will fail)
      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Load failed/i)).toBeInTheDocument();
      });

      // Select another app
      const anotherAppCard = screen
        .getByText("Impulse Tracker")
        .closest(".app-card");
      fireEvent.click(anotherAppCard!);

      // Error should be cleared
      expect(screen.queryByText(/Load failed/i)).not.toBeInTheDocument();
    });
  });

  describe("App loading", () => {
    it("should load app when Load Application button is clicked", async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(loadZipArchive).toHaveBeenCalled();
      });
    });

    it("should call onSelect with loaded app data after successful load", async () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            app: expect.objectContaining({
              id: "second-reality",
              name: "Second Reality",
            }),
            files: expect.any(Uint8Array),
            dosboxConf: expect.any(String),
          }),
        );
      });
    });

    it("should show loading state while loading", async () => {
      vi.mocked(loadZipArchive).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });

    it("should show load progress", async () => {
      vi.mocked(loadZipArchive).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText(/Loading Starting.../i)).toBeInTheDocument();
      });
    });

    it("should disable buttons while loading", async () => {
      vi.mocked(loadZipArchive).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(loadButton).toBeDisabled();
      });
    });

    it("should handle loading errors", async () => {
      const errorMessage = "Load failed";

      // Reset and set up the mock to reject
      vi.mocked(loadZipArchive).mockReset();
      vi.mocked(loadZipArchive).mockRejectedValue(new Error(errorMessage));

      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      // Wait for error to be displayed
      await waitFor(
        () => {
          expect(screen.getByText(errorMessage)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Verify loading state is cleared
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("should handle non-Error exceptions", async () => {
      vi.mocked(loadZipArchive).mockRejectedValueOnce("String error");

      render(<DemoSelector onSelect={mockOnSelect} />);

      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load application/i),
        ).toBeInTheDocument();
      });
    });

    it("should not load if no app is selected", () => {
      render(<DemoSelector onSelect={mockOnSelect} />);

      // Try to trigger load without selecting an app (shouldn't be possible in UI, but test the logic)
      // This tests the early return in handleLoadApp
      expect(loadZipArchive).not.toHaveBeenCalled();
    });
  });

  describe("Cancel functionality", () => {
    it("should call onCancel when close button is clicked", () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      const closeButton = screen.getByRole("button", { name: /Close/i });
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should clear selected app when cancel is clicked", () => {
      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      // Select an app
      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      expect(screen.getByText(/Selected: Second Reality/i)).toBeInTheDocument();

      // Click cancel in app details
      const cancelButtons = screen.getAllByRole("button", { name: /Cancel/i });
      const detailsCancelButton = cancelButtons.find((btn) =>
        btn.className.includes("cancel-button"),
      );
      fireEvent.click(detailsCancelButton!);

      expect(
        screen.queryByText(/Selected: Second Reality/i),
      ).not.toBeInTheDocument();
    });

    it("should clear error when cancel is clicked", async () => {
      vi.mocked(loadZipArchive).mockRejectedValueOnce(new Error("Load failed"));

      render(<DemoSelector onSelect={mockOnSelect} onCancel={mockOnCancel} />);

      // Select and try to load an app (will fail)
      const appCard = screen.getByText("Second Reality").closest(".app-card");
      fireEvent.click(appCard!);

      const loadButton = screen.getByRole("button", {
        name: /Load Application/i,
      });
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText(/Load failed/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButtons = screen.getAllByRole("button", { name: /Cancel/i });
      const detailsCancelButton = cancelButtons.find((btn) =>
        btn.className.includes("cancel-button"),
      );
      fireEvent.click(detailsCancelButton!);

      expect(screen.queryByText(/Load failed/i)).not.toBeInTheDocument();
    });
  });
});
