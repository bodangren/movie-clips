import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders with default props", () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar).toBeInTheDocument();
  });

  it("displays percentage when showValue is true", () => {
    render(<ProgressBar value={75} showValue />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("displays step label when provided", () => {
    render(<ProgressBar value={50} label="Analyzing video..." />);
    expect(screen.getByText("Analyzing video...")).toBeInTheDocument();
  });

  it("shows correct progress bar width", () => {
    render(<ProgressBar value={60} />);
    const fillBar = screen.getByTestId("progress-fill");
    expect(fillBar).toHaveStyle({ width: "60%" });
  });

  it("clamps value between 0 and 100", () => {
    const { rerender } = render(<ProgressBar value={150} />);
    let fillBar = screen.getByTestId("progress-fill");
    expect(fillBar).toHaveStyle({ width: "100%" });

    rerender(<ProgressBar value={-20} />);
    fillBar = screen.getByTestId("progress-fill");
    expect(fillBar).toHaveStyle({ width: "0%" });
  });

  it("applies animated class when animate is true", () => {
    render(<ProgressBar value={50} animate />);
    const fillBar = screen.getByTestId("progress-fill");
    expect(fillBar).toHaveClass("transition-all", "duration-300");
  });

  it("shows complete state at 100%", () => {
    render(<ProgressBar value={100} showValue />);
    const fillBar = screen.getByTestId("progress-fill");
    expect(fillBar).toHaveClass("bg-green-500");
  });

  it("applies custom className", () => {
    render(<ProgressBar value={50} className="custom-class" />);
    const wrapper = screen.getByTestId("progress-bar").parentElement;
    expect(wrapper).toHaveClass("custom-class");
  });
});
