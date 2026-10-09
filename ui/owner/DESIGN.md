---
name: Technical Precision Interface
colors:
  surface: '#ffffff'
  surface-dim: '#ddd9db'
  surface-bright: '#fdf8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f2f5'
  surface-container: '#f1ecef'
  surface-container-high: '#ece7e9'
  surface-container-highest: '#e6e1e4'
  on-surface: '#1c1b1d'
  on-surface-variant: '#444654'
  inverse-surface: '#313032'
  inverse-on-surface: '#f4eff2'
  outline: '#757686'
  outline-variant: '#c5c5d6'
  surface-tint: '#3351d2'
  primary: '#304fcf'
  on-primary: '#ffffff'
  primary-container: '#4c69e9'
  on-primary-container: '#fffbff'
  inverse-primary: '#b9c3ff'
  secondary: '#5e5e63'
  on-secondary: '#ffffff'
  secondary-container: '#e0dfe4'
  on-secondary-container: '#626267'
  tertiary: '#006a34'
  on-tertiary: '#ffffff'
  tertiary-container: '#008644'
  on-tertiary-container: '#f6fff3'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001257'
  on-primary-fixed-variant: '#0d36ba'
  secondary-fixed: '#e3e2e7'
  secondary-fixed-dim: '#c7c6cb'
  on-secondary-fixed: '#1a1b1f'
  on-secondary-fixed-variant: '#46464b'
  tertiary-fixed: '#6dfe9c'
  tertiary-fixed-dim: '#4de082'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#fdf8fb'
  on-background: '#1c1b1d'
  surface-variant: '#e6e1e4'
  surface-subtle: '#fafafa'
  surface-muted: '#f4f4f5'
  border-subtle: '#e4e4e7'
  border-strong: '#d4d4d8'
  text-primary: '#121113'
  text-secondary: '#52525b'
  text-muted: '#71717a'
  accent-focus: rgba(98, 126, 255, 0.25)
  success: '#16a34a'
  success-subtle: '#f0fdf4'
  error-subtle: '#fef2f2'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.005em
  code-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system embodies the focused, developer-grade efficiency of modern technical platforms. Designed for mission-critical digital workflows, the personality is rigorous, direct, and free from superficial decoration. It mirrors the utilitarian clarity found in elite engineering tools, algorithmic problem-solving interfaces, and streamlined developer portals.

The style is grounded in **Technical Minimalism**:
- Uncluttered, crisp neutral planes paired with razor-sharp 1px dividers.
- High-contrast, unambiguous typography with restrained weight distribution.
- Zero decorative gradients, no blurred backdrops, and an absence of speculative AI glows.
- Purposeful color placement: chromatic accents are reserved strictly for primary actions, semantic confirmations, and explicit interactive focus.

## Colors

The color system prioritizes structural hygiene and immediate visual comprehension:

- **Key Primary (`#627eff`)**: A restrained, electric indigo/blue derived from developer-tool active states. Used exclusively for primary triggers, selection indicators, active tabs, and focus boundaries.
- **Key Secondary (`#1e1f23`)**: Deep technical charcoal, anchoring dense utility toolbars, high-priority interactive badges, and inverted control caps.
- **Key Tertiary (`#4ade80`)**: Clean terminal green, signaling passing test states, verified integrity, and live connectivity.
- **Neutrals (`#121113` to `#ffffff`)**: Crisp white and slightly off-white surfaces (`#fafafa`, `#f4f4f5`) framed by neutral borders (`#e4e4e7`, `#d4d4d8`). Primary text uses near-black (`#121113`) to maximize scannability under prolonged analytical use.

## Typography

The typographic hierarchy prioritizes systematic density, legibility, and technical economy. Weights are tightly restricted to 400 (Regular), 500 (Medium), and 600 (Semibold); bold and extra-bold weights (700+) are entirely prohibited to prevent visual bloat.

- **Scale & Tracking**: Headlines use compact scale ratios and subtle negative tracking (`-0.01em` to `-0.025em`) to ensure titles read as structural system labels rather than marketing banners.
- **Body & Data**: Content default is `body-md` (14px) and `body-sm` (13px), standardizing reading pace for documentation, problem statements, and data registries.
- **Monospace Elements**: System hashes, algorithmic keys, and code sequences utilize `Geist Mono` at `code-sm` (12px) for exact character grid alignment.

## Layout & Spacing

Layouts operate on a strict 4px/8px mathematical base unit, calibrated for developer-grade density:

- **Grid Architecture**: 12-column fluid grid system across desktop, defaulting to structural work surfaces with a maximum content container width of `1280px`.
- **Breakpoints**: Mobile (<640px, 4-column, 12px gutters), Tablet (640px–1024px, 8-column, 16px gutters), Desktop (>1024px, 12-column, 16px gutters).
- **Rhythm & Padding**: Component spacing strictly leverages `space-xs` (4px), `space-sm` (8px), `space-md` (12px), `space-lg` (16px), and `space-xl` (24px). Spacing avoids excessive whitespace, preferring compact, scannable data groupings.

## Elevation & Depth

Visual hierarchy is built on **low-contrast outlines** and pure tonal plane shifts rather than simulated atmospheric light:

- **Flat Construction**: Elevation is created through 1px solid `#e4e4e7` borders separating white `#ffffff` and subtle `#fafafa` surfaces.
- **Shadow Elimination**: Shadows are avoided across regular layout elements (cards, headers, toolbars, sidebars).
- **Interactive Micro-Offset (Level 1)**: For floating overlays, dropdowns, and context menus, use an ultra-restrained border paired with an invisible blur offset: `box-shadow: 0 1px 3px 0 rgba(18, 17, 19, 0.06), 0 1px 2px -1px rgba(18, 17, 19, 0.04)`.
- **Modals (Level 2)**: Crisp 1px `#d4d4d8` containment, centered against a flat, neutral-tinted backdrop (`rgba(18, 17, 19, 0.4)`), with minimal diffusion: `box-shadow: 0 4px 12px rgba(18, 17, 19, 0.08)`.

## Shapes

The shape vocabulary is engineered, disciplined, and compact:

- **Controls**: Buttons, text inputs, segmented pills, and dropdown triggers maintain a rigid `4px` to `6px` radius (`roundedness: 1`).
- **Containers**: Cards, code blocks, problem panels, and modal shells use `6px` to `8px`.
- **Pills**: Curvature (`rounded-full`) is disallowed for standard controls, reserved strictly for numeric count tags and categorical status dots.

## Components

### Buttons
- **Primary**: Solid background `#627eff`, crisp text `#ffffff`, border radius `5px`, height `34px`, typography `label-md`. Hover shifts to `#506ff0`. Focus produces an outline ring `0 0 0 2px #ffffff, 0 0 0 4px #627eff`.
- **Secondary / Outline**: 1px solid `#e4e4e7`, background `#ffffff`, text `#121113`. Hover state transitions to `#f4f4f5` background with `#d4d4d8` border.
- **Ghost**: Background transparent, text `#52525b`, hover background `#f4f4f5`, text `#121113`.
- **Danger**: Background `#ffffff`, text `#dc2626`, border 1px solid `#fecaca`. Hover background `#fef2f2`.

### Input Fields & Controls
- **Text Inputs**: Height `34px`, background `#ffffff`, 1px solid `#e4e4e7`, text `#121113`, placeholder `#71717a`, radius `5px`.
- **Focus State**: Border color becomes `#627eff`, accompanied by `box-shadow: 0 0 0 2px rgba(98, 126, 255, 0.2)`. Zero heavy glow effects.
- **Checkboxes & Radios**: `16px x 16px`, 1px solid `#d4d4d8`, radius `3px` (checkbox) or circular (radio). Active state fills `#627eff` with white glyph.

### Cards & Code Containers
- **Panels**: Background `#ffffff`, 1px solid `#e4e4e7`, radius `6px`. Zero default shadow.
- **Panel Header**: Height `40px`, background `#fafafa`, border-bottom 1px solid `#e4e4e7`, padding `0 12px`, typography `label-sm`.

### Chips & Semantic Indicators
- **Standard Tag**: Background `#f4f4f5`, text `#52525b`, border 1px solid `#e4e4e7`, radius `4px`, padding `2px 6px`, typography `label-sm`.
- **Success / Accepted**: Background `#f0fdf4`, text `#16a34a`, border 1px solid `#bbf7d0`.
- **Active Filter**: Background `rgba(98, 126, 255, 0.1)`, text `#627eff`, border 1px solid `rgba(98, 126, 255, 0.2)`.

### Tables & Dense Lists
- **Rows**: Fixed compact height `38px` or `42px`, 1px solid `#f4f4f5` dividers. Row hover triggers `#fafafa`.
- **Header Cell**: Height `32px`, background `#fafafa`, typography `label-sm`, color `#71717a`, font weight `500`.

### Technical Workspace Widgets
- **Console / Output Panel**: Monospace text in `Geist Mono`, background `#fafafa`, border 1px solid `#e4e4e7`, radius `6px`, padding `10px 12px`.
- **Key-Value Metadata Grid**: Compact vertical pairs separated by 1px solid `#e4e4e7`, using `label-sm` muted keys and `body-sm` primary values.