import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((cmd: string) => {
    if (cmd === "get_app_info") {
      return Promise.resolve({
        name: "movie-clips",
        version: "0.1.0",
        platform: "linux",
        arch: "x86_64",
      });
    }
    if (cmd === "greet") {
      return Promise.resolve("Hello, World! You've been greeted from Rust!");
    }
    if (cmd === "scan_directory") {
      return Promise.resolve(["file1.txt", "file2.txt"]);
    }
    return Promise.reject(new Error(`Unknown command: ${cmd}`));
  }),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the welcome heading", async () => {
    render(<App />);
    const heading = await screen.findByText(/Welcome to movie-clips/i);
    expect(heading).toBeInTheDocument();
  });

  it("displays app info after loading", async () => {
    render(<App />);
    const appInfo = await screen.findByText(/movie-clips v0\.1\.0 on linux\/x86_64/i);
    expect(appInfo).toBeInTheDocument();
  });

  it("has a greet form with input and button", () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter a name/i);
    const button = screen.getByRole("button", { name: /Greet/i });
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it("has a directory scanner section", () => {
    render(<App />);
    const scannerHeading = screen.getByRole("heading", { name: /Directory Scanner/i });
    expect(scannerHeading).toBeInTheDocument();
    const pathInput = screen.getByPlaceholderText(/\/path\/to\/directory/i);
    expect(pathInput).toBeInTheDocument();
  });
});
