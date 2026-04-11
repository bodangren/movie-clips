import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineMonitor } from "./PipelineMonitor";
import { usePipelineStore } from "@/stores/pipeline.store";

describe("PipelineMonitor", () => {
  beforeEach(() => {
    usePipelineStore.setState({
      status: "idle",
      progress: 0,
      currentStep: "",
      errors: [],
    });
  });

  it("renders status indicator", () => {
    render(<PipelineMonitor />);
    expect(screen.getByTestId("status-indicator")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    render(<PipelineMonitor />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });

  it("renders log viewer", () => {
    render(<PipelineMonitor />);
    expect(screen.getByTestId("log-viewer")).toBeInTheDocument();
  });

  it("displays current step label", () => {
    usePipelineStore.setState({ currentStep: "Analyzing video..." });
    render(<PipelineMonitor />);
    const labels = screen.getAllByText("Analyzing video...");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("shows error count when there are errors", () => {
    usePipelineStore.setState({ errors: ["Error 1", "Error 2"] });
    render(<PipelineMonitor />);
    expect(screen.getByText("2 errors")).toBeInTheDocument();
  });

  it("renders start button when idle", () => {
    render(<PipelineMonitor />);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("renders pause button when running", () => {
    usePipelineStore.setState({ status: "running" });
    render(<PipelineMonitor />);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("renders resume button when paused", () => {
    usePipelineStore.setState({ status: "paused" });
    render(<PipelineMonitor />);
    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("renders reset button when not idle", () => {
    usePipelineStore.setState({ status: "completed" });
    render(<PipelineMonitor />);
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("calls start when start button is clicked", () => {
    const startMock = vi.fn();
    usePipelineStore.setState({ start: startMock });
    render(<PipelineMonitor />);
    screen.getByRole("button", { name: /start/i }).click();
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("shows log filter buttons", () => {
    render(<PipelineMonitor showLogFilter />);
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /errors/i })).toBeInTheDocument();
  });
});
