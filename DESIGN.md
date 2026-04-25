---
version: '1.1.0'
name: 'Movie Clips: Superhuman Pulse'
colors:
  primary: '#8B5CF6'
  primary-foreground: '#FFFFFF'
  secondary: '#1F2937'
  secondary-foreground: '#F3F4F6'
  muted: '#111827'
  muted-foreground: '#9CA3AF'
  accent: '#8B5CF6'
  accent-foreground: '#FFFFFF'
  destructive: '#EF4444'
  destructive-foreground: '#FEE2E2'
  background: '#050505'
  foreground: '#E5E7EB'
  card: '#0C0C0C'
  card-foreground: '#E5E7EB'
  input: '#111827'
  ring: '#8B5CF6'
typography:
  display:
    fontFamily: 'Inter'
    fontWeight: '700'
  headline:
    fontFamily: 'Inter'
    fontWeight: '600'
  title:
    fontFamily: 'Inter'
    fontWeight: '500'
  body:
    fontFamily: 'Inter'
    fontWeight: '400'
  label:
    fontFamily: 'Inter'
    fontWeight: '500'
  mono:
    fontFamily: 'Geist Mono'
    fontWeight: '400'
spacing:
  unit: '4px'
rounded:
  sm: '2px'
  md: '4px'
  lg: '6px'
  xl: '8px'
  full: '9999px'
---

# Superhuman Pulse Design System

## Philosophy: Keyboard-First Precision

Movie Clips adopts the "Superhuman Pulse" identity—a premium, atmospheric interface optimized for high-velocity creation. Every interaction is designed to feel instantaneous, with a focus on keyboard-driven workflows and subtle visual feedback that guides the eye without distraction.

## Atmospheric Depth (Colors)

The palette is built on a foundation of "Obsidian" blacks to minimize eye strain and maximize the impact of content.

- **Obsidian (#050505):** The absolute background, providing a void-like depth.
- **Shadow (#0C0C0C):** Elevated surfaces that appear to float above the obsidian base.
- **Ultraviolet (#8B5CF6):** The signature pulse. Used sparingly for critical focus states and primary actions.
- **Silver (#E5E7EB):** High-contrast text for effortless scanning.
- **Mist (#9CA3AF):** De-emphasized metadata and secondary information.

## Precise Typography

We use **Inter** for its neutral, highly legible character at all scales, and **Geist Mono** for technical precision.

- **Interaction Density:** Tight line-heights and letter-spacing to allow more information to be visible simultaneously without clutter.
- **Monospace Clarity:** Geist Mono is used for all IDs, timestamps, and log outputs to ensure character alignment.

## Spatial System

A strict **4px atomic grid** governs all layout decisions. Padding and margins are minimal to maintain a "pro tool" density.

## Structural Geometry (Roundness)

Corners are sharp and precise. Large radii are avoided to maintain a serious, high-performance aesthetic.

- **Functional (4px):** Standard for buttons and inputs.
- **Containment (6-8px):** Reserved for larger cards and modals.

## The Ultraviolet Pulse (Visual Effects)

### The Glow

Primary interactive elements feature a signature ultraviolet glow (`#8B5CF6` at 15% opacity). This glow is not a shadow, but an aura that signifies readiness.

### Motion Performance

Transitions are near-instantaneous (150ms). We use "Spring" physics for micro-interactions to provide tactile feedback that mimics mechanical responsiveness.

### Keyboard Hints

Shortcut labels are treated as first-class UI elements, appearing as subtle, mist-colored badges next to actions.

## Layout Architecture

### Command Center

The main navigation is a minimal, collapsible sidebar that prioritizes screen real estate for the video preview and timeline.

### Focus Grid

Media elements are arranged in a high-density grid with 1px borders, creating a structured, spreadsheet-like efficiency for managing large libraries.
