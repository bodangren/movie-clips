import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    render(<Skeleton>Loading...</Skeleton>);
    const skeleton = screen.getByText("Loading...");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders text variant by default", () => {
    render(<Skeleton variant="text">Text</Skeleton>);
    const skeleton = screen.getByText("Text");
    expect(skeleton).toHaveClass("animate-pulse", "bg-muted");
  });

  it("renders circle variant", () => {
    render(<Skeleton variant="circle" className="w-12 h-12">Avatar</Skeleton>);
    const skeleton = screen.getByText("Avatar");
    expect(skeleton).toHaveClass("rounded-full");
  });

  it("renders rect variant", () => {
    render(<Skeleton variant="rect" className="w-full h-32">Card</Skeleton>);
    const skeleton = screen.getByText("Card");
    expect(skeleton).toHaveClass("rounded-md");
  });

  it("forwards className", () => {
    render(<Skeleton className="custom-class">Content</Skeleton>);
    const skeleton = screen.getByText("Content");
    expect(skeleton).toHaveClass("custom-class");
  });
});
