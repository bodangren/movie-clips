import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  const mockLinks = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/library", label: "Library", icon: "library" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  it("renders navigation links", () => {
    render(<Sidebar links={mockLinks} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("applies active class to current route", () => {
    render(<Sidebar links={mockLinks} currentPath="/" />);
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveClass("bg-accent");
  });

  it("does not apply active class to non-current routes", () => {
    render(<Sidebar links={mockLinks} currentPath="/" />);
    const libraryLink = screen.getByText("Library").closest("a");
    expect(libraryLink).not.toHaveClass("bg-accent");
  });

  it("calls onToggle when collapse button is clicked", () => {
    const handleToggle = vi.fn();
    render(<Sidebar links={mockLinks} collapsed={false} onToggle={handleToggle} />);
    const toggleButton = screen.getByRole("button", { name: /collapse/i });
    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("shows collapsed state with icons only", () => {
    render(<Sidebar links={mockLinks} collapsed={true} />);
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("shows expanded state with labels", () => {
    render(<Sidebar links={mockLinks} collapsed={false} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
  });
});
