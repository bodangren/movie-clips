import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

class ErrorThrower extends Component<{ shouldThrow: boolean }> {
  componentDidUpdate(prevProps: { shouldThrow: boolean }): void {
    if (this.props.shouldThrow && !prevProps.shouldThrow) {
      throw new Error("Test error");
    }
  }

  render(): ReactNode {
    if (this.props.shouldThrow) {
      throw new Error("Test error");
    }
    return <div>Content rendered successfully</div>;
  }
}

describe("ErrorBoundary", () => {
  const FallbackComponent = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div>
      <p data-testid="error-message">{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  );

  it("renders children when no error", () => {
    render(
      <ErrorBoundary fallback={FallbackComponent}>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback when error occurs", () => {
    render(
      <ErrorBoundary fallback={FallbackComponent}>
        <ErrorThrower shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("calls resetError when retry button is clicked", () => {
    const handleReset = vi.fn();
    const ResetFallback = ({ resetError }: { error: Error; resetError: () => void }) => (
      <div>
        <p data-testid="error-message">{resetError}</p>
        <button onClick={handleReset}>Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={ResetFallback}>
        <ErrorThrower shouldThrow={true} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleReset).toHaveBeenCalled();
  });

  it("logs errors to console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={FallbackComponent}>
        <ErrorThrower shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
