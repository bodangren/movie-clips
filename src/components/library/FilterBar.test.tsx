import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./FilterBar";

describe("FilterBar", () => {
  const mockGenres = ["Action", "Comedy", "Drama", "Horror"];

  it("renders search input", () => {
    render(<FilterBar onSearchChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders genre filter when genres provided", () => {
    render(<FilterBar genres={mockGenres} onGenreChange={() => {}} />);
    expect(screen.getByText("All Genres")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Comedy")).toBeInTheDocument();
  });

  it("renders year filter when years provided", () => {
    render(<FilterBar years={[2020, 2021, 2022]} onYearChange={() => {}} />);
    expect(screen.getByText("All Years")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("renders sort options when provided", () => {
    const sortOptions = [
      { value: "title", label: "Title" },
      { value: "year", label: "Year" },
    ];
    render(<FilterBar sortOptions={sortOptions} onSortChange={() => {}} />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("calls onSearchChange when search input changes", () => {
    const handleSearch = vi.fn();
    render(<FilterBar onSearchChange={handleSearch} />);
    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "Batman" } });
    expect(handleSearch).toHaveBeenCalledWith("Batman");
  });

  it("calls onGenreChange when genre is selected", () => {
    const handleGenre = vi.fn();
    render(<FilterBar genres={mockGenres} onGenreChange={handleGenre} />);
    const select = screen.getByRole("combobox", { name: /genre/i });
    fireEvent.change(select, { target: { value: "Action" } });
    expect(handleGenre).toHaveBeenCalledWith("Action");
  });

  it("calls onSortChange when sort is selected", () => {
    const handleSort = vi.fn();
    const sortOptions = [
      { value: "title", label: "Title" },
      { value: "year", label: "Year" },
    ];
    render(<FilterBar sortOptions={sortOptions} onSortChange={handleSort} />);
    const select = screen.getByRole("combobox", { name: /sort/i });
    fireEvent.change(select, { target: { value: "year" } });
    expect(handleSort).toHaveBeenCalledWith("year");
  });

  it("shows active filter count", () => {
    render(
      <FilterBar
        genres={mockGenres}
        activeGenre="Action"
        onGenreChange={() => {}}
      />
    );
    expect(screen.getByText("1 filter active")).toBeInTheDocument();
  });

  it("has clear button when filters are active", () => {
    render(
      <FilterBar
        genres={mockGenres}
        activeGenre="Action"
        onClearFilters={() => {}}
        onGenreChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("calls onClearFilters when clear button is clicked", () => {
    const handleClear = vi.fn();
    render(
      <FilterBar
        genres={mockGenres}
        activeGenre="Action"
        onClearFilters={handleClear}
        onGenreChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
