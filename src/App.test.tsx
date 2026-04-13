import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import App from "./App";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((cmd) => {
    if (cmd === "get_app_info") {
      return Promise.resolve({
        name: "movie-clips",
        version: "0.1.0",
        platform: "linux",
        arch: "x86_64",
      });
    }
    return Promise.resolve();
  }),
}));

// Mock resize observer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard heading", async () => {
    render(<App />);
    const main = screen.getByRole("main");
    const heading = await within(main).findByText(/Director's Dashboard/i);
    expect(heading).toBeInTheDocument();
  });

  it("renders the navigation sidebar", () => {
    render(<App />);
    const aside = screen.getByRole("complementary");
    expect(within(aside).getByText(/MOVIE CLIPS/i)).toBeInTheDocument();
    expect(within(aside).getByText(/Dashboard/i)).toBeInTheDocument();
    expect(within(aside).getByText(/Media Library/i)).toBeInTheDocument();
  });

  it("displays dashboard cards", async () => {
    render(<App />);
    const main = screen.getByRole("main");
    expect(await within(main).findByText(/Active Pipeline/i)).toBeInTheDocument();
    expect(within(main).getByText(/Library Status/i)).toBeInTheDocument();
    // System card title is a heading
    expect(within(main).getByRole("heading", { name: /System/i })).toBeInTheDocument();
  });
});
