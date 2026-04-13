import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("renders with value", () => {
    render(<Input value="test value" onChange={() => {}} />);
    expect(screen.getByDisplayValue("test value")).toBeInTheDocument();
  });

  it("handles change events", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("displays label when provided", () => {
    render(<Input label="Email" placeholder="Enter email..." />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    render(<Input error="This field is required" placeholder="Enter..." />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("has error styling when error is present", () => {
    render(<Input error="Error" placeholder="Enter..." />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-destructive");
  });

  it("forwards className", () => {
    render(<Input className="custom-class" placeholder="Enter..." />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("forwards ref to input element", () => {
    let refValue: HTMLInputElement | null = null;
    render(<Input ref={(el) => { refValue = el; }} placeholder="Enter..." />);
    expect(refValue).toBeInstanceOf(HTMLInputElement);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Input disabled placeholder="Enter..." />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });
});
