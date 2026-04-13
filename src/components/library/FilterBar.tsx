import { useState, type ChangeEvent } from 'react';
import { Input, Select } from '@/components/ui';

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  genres?: string[];
  years?: number[];
  sortOptions?: SortOption[];
  searchQuery?: string;
  activeGenre?: string;
  activeYear?: string;
  activeSort?: string;
  onSearchChange?: (query: string) => void;
  onGenreChange?: (genre: string) => void;
  onYearChange?: (year: string) => void;
  onSortChange?: (sort: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function FilterBar({
  genres = [],
  years = [],
  sortOptions = [],
  searchQuery = '',
  activeGenre,
  activeYear,
  activeSort,
  onSearchChange,
  onGenreChange,
  onYearChange,
  onSortChange,
  onClearFilters,
  className = '',
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    onSearchChange?.(e.target.value);
  };

  const filterCount = [activeGenre, activeYear, activeSort].filter(Boolean).length;

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map(g => ({ value: g, label: g })),
  ];

  const yearOptions = [
    { value: '', label: 'All Years' },
    ...years.map(y => ({ value: String(y), label: String(y) })),
  ];

  const sortSelectOptions = sortOptions.map(s => ({
    value: s.value,
    label: s.label,
  }));

  return (
    <div
      className={['flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex-1 min-w-[200px]">
        <Input
          type="search"
          placeholder="Search..."
          value={localSearch}
          onChange={handleSearchChange}
          aria-label="Search"
        />
      </div>

      {genres.length > 0 && (
        <Select
          options={genreOptions}
          value={activeGenre || ''}
          onChange={e => onGenreChange?.(e.target.value)}
          aria-label="Genre filter"
          className="w-40"
        />
      )}

      {years.length > 0 && (
        <Select
          options={yearOptions}
          value={activeYear || ''}
          onChange={e => onYearChange?.(e.target.value)}
          aria-label="Year filter"
          className="w-32"
        />
      )}

      {sortOptions.length > 0 && (
        <Select
          options={sortSelectOptions}
          value={activeSort || ''}
          onChange={e => onSortChange?.(e.target.value)}
          aria-label="Sort"
          className="w-32"
        />
      )}

      {filterCount > 0 && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear ({filterCount})
        </button>
      )}

      {filterCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {filterCount} filter{filterCount > 1 ? 's' : ''} active
        </span>
      )}
    </div>
  );
}
