# Track Plan: UI Components

## Status Notes
- **Created:** 2025-04-03
- **Updated:** 2026-04-11
- **Priority:** Medium
- **Estimated Duration:** 3 days
- **Dependencies:** config_state_20250403, pipeline_orchestration_20250403

## Phase 1: Design System & Base Components

### Tasks

- [x] 1.1 Create components directory structure
  - Create `src/components/ui/` for base components
  - Create `src/components/layout/` for layout components
  - Create `src/components/library/` for library browser components
  - Create `src/components/pipeline/` for pipeline monitor components
  - Create `src/components/config/` for config panel components

- [x] 1.2 Button component with variants
  - Create `src/components/ui/Button.tsx`
  - Variants: primary, secondary, ghost, destructive
  - Sizes: sm, md, lg
  - Support loading state
  - Write tests first (TDD) [checkpoint: 730b7b1]

## Phase 2: Layout & Navigation

- [ ] 1.3 Card component
  - Create `src/components/ui/Card.tsx`
  - Header, content, footer slots
  - Hover state support
  - Write tests first (TDD)

- [ ] 1.4 Form input components
  - Create `src/components/ui/Input.tsx`
  - Create `src/components/ui/Select.tsx`
  - Create `src/components/ui/Textarea.tsx`
  - Label and error message support
  - Write tests first (TDD)

- [ ] 1.5 Modal/Dialog component
  - Create `src/components/ui/Modal.tsx`
  - Overlay, close button, escape key
  - Portal rendering
  - Write tests first (TDD)

## Phase 2: Layout & Navigation

### Tasks

- [x] 2.1 Sidebar navigation component
  - Create `src/components/layout/Sidebar.tsx`
  - Navigation links with icons
  - Collapsible state
  - Active state highlighting [checkpoint: 64457a0]

- [x] 2.2 Main layout wrapper
  - Create `src/components/layout/MainLayout.tsx`
  - Sidebar + content area structure
  - Responsive sidebar toggle [checkpoint: 64457a0]

- [x] 2.3 Page header component
  - Create `src/components/layout/PageHeader.tsx`
  - Title, description, actions slot [checkpoint: 64457a0]

## Phase 3: Library Browser Components

## Phase 3: Library Browser Components

### Tasks

- [x] 3.1 Media card component
  - Create `src/components/library/MediaCard.tsx`
  - Poster image, title, year, metadata
  - Hover state with actions [checkpoint: 5889d10]

- [x] 3.2 Media grid component
  - Create `src/components/library/MediaGrid.tsx`
  - Responsive grid layout
  - Loading skeleton state [checkpoint: 5889d10]

- [x] 3.3 Filter bar component
  - Create `src/components/library/FilterBar.tsx`
  - Search input
  - Genre/year filters
  - Sort options [checkpoint: 5889d10]

## Phase 4: Pipeline Monitor Components

### Tasks

- [x] 4.1 Pipeline status indicator
  - Create `src/components/pipeline/StatusIndicator.tsx`
  - States: idle, running, completed, failed, paused
  - Animated running state [checkpoint: 27aac30]

- [x] 4.2 Progress bar component
  - Create `src/components/pipeline/ProgressBar.tsx`
  - Percentage display
  - Step label
  - Animated progress [checkpoint: 27aac30]

- [x] 4.3 Pipeline log viewer
  - Create `src/components/pipeline/LogViewer.tsx`
  - Scrollable log display
  - Timestamp and level (info, warn, error)
  - Auto-scroll to bottom [checkpoint: 27aac30]

- [x] 4.4 Pipeline monitor dashboard
  - Create `src/components/pipeline/PipelineMonitor.tsx`
  - Integrates StatusIndicator, ProgressBar, LogViewer
  - Connect to pipeline store [checkpoint: 27aac30]

## Phase 5: Configuration Panel Components

### Tasks

- [x] 5.1 Config section component
  - Create `src/components/config/ConfigSection.tsx`
  - Collapsible sections
  - Section title and description [checkpoint: 5f96e58]

- [x] 5.2 Config form integration
  - Create `src/components/config/ConfigForm.tsx`
  - React Hook Form + Zod integration
  - Field components from design system
  - Validation feedback [checkpoint: 5f96e58]

## Phase 6: Theme & Polish

### Tasks

- [ ] 6.1 Theme provider
  - Create `src/components/providers/ThemeProvider.tsx`
  - Dark/light mode toggle
  - System preference detection
  - CSS custom properties

- [ ] 6.2 Error boundary component
  - Create `src/components/providers/ErrorBoundary.tsx`
  - Error display with retry action
  - Fallback UI

- [ ] 6.3 Loading skeleton component
  - Create `src/components/ui/Skeleton.tsx`
  - Animated pulse effect
  - Shape variants (text, circle, rect)

## Success Checklist
- [ ] All acceptance criteria from spec met
- [ ] Tests pass with >80% coverage for new code
- [ ] Code follows style guides (TypeScript)
- [ ] Documentation updated
- [ ] Manual verification successful

## Checkpoints
- Phase 1: [checkpoint: 730b7b1]
- Phase 2: [checkpoint: 64457a0]
- Phase 3: [checkpoint: 5889d10]
- Phase 4: [checkpoint: 27aac30]
- Phase 5: [checkpoint: 5f96e58]
- Phase 6: [checkpoint: ]
