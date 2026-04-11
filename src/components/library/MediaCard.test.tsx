import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaCard } from "./MediaCard";
import type { Movie } from "@/lib/library/types";

describe("MediaCard", () => {
  const mockMovie: Movie = {
    path: "/movies/bad-boys.mkv",
    type: "movie",
    name: "Bad Boys",
    extension: ".mkv",
    size: 1_500_000_000,
    modifiedAt: new Date("2025-01-15"),
    metadata: {
      title: "Bad Boys",
      year: 1995,
      runtime: 120,
      genres: ["Action", "Comedy"],
      director: "Michael Bay",
    },
    subtitlePaths: [],
    posterPath: "/posters/bad-boys.jpg",
  };

  it("renders movie title", () => {
    render(<MediaCard item={mockMovie} />);
    expect(screen.getByText("Bad Boys")).toBeInTheDocument();
  });

  it("renders movie year", () => {
    render(<MediaCard item={mockMovie} />);
    expect(screen.getByText("1995")).toBeInTheDocument();
  });

  it("renders genres when showGenres is true", () => {
    render(<MediaCard item={mockMovie} showGenres />);
    expect(screen.getByText(/Action, Comedy/)).toBeInTheDocument();
  });

  it("renders poster image when available", () => {
    render(<MediaCard item={mockMovie} />);
    const img = screen.getByAltText("Bad Boys poster");
    expect(img).toBeInTheDocument();
  });

  it("renders placeholder when poster is not available", () => {
    const movieWithoutPoster = { ...mockMovie, posterPath: undefined };
    render(<MediaCard item={movieWithoutPoster} />);
    const placeholder = screen.getByTestId("media-card-placeholder");
    expect(placeholder).toBeInTheDocument();
  });

  it("renders runtime when available", () => {
    render(<MediaCard item={mockMovie} showRuntime />);
    expect(screen.getByText("120 min")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<MediaCard item={mockMovie} onClick={handleClick} />);
    const card = screen.getByTestId("media-card");
    card.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
