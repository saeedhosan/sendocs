---
name: Sendocs Professional Interface System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#005338'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
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
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-sm:
    fontFamily: JetBrains Mono
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
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an exacting, dependable, and high-trust visual language tailored for confidential document exchange and compliance workflows used by accountants, attorneys, and financial consultants. 

The aesthetic is grounded in modern corporate minimalism: structural precision, high typographic legibility, razor-thin definition, and disciplined functional color. It rejects frivolous gradients, skeuomorphic noise, and hyper-saturated novelty in favor of calm clarity and institutional rigor. The UI evokes the quiet authority of an elite law office paired with the effortless speed and precision of enterprise developer tools. Every interface element exists to reduce operational anxiety, reinforce data integrity, and guarantee instantaneous comprehension.

## Colors

The color palette is built on strict utility and contrast:

- **Canvas & Surfaces**: The default application canvas uses layered cool whites (`#ffffff`, `#f8fafc`, and `#f1f5f9`). Layering creates structural zoning without heavy separators.
- **Text & Hierarchy**: Content legibility relies on deep slate tones:
  - Primary text: Slate 900 (`#0f172a`) for maximum contrast and readability.
  - Secondary text: Slate 700 (`#334155`) for structural labels and table cells.
  - Tertiary/Muted text: Slate 500 (`#64748b`) for hints, timestamps, and metadata.
- **Primary Action**: Precision Indigo (`#4f46e5`) serves as the single primary accent color, driving primary calls to action, active indicators, and focus states. Hover states shift to Indigo 700 (`#4338ca`).
- **Dividers & Borders**: Outlines use Slate 200 (`#e2e8f0`) for structural panel dividers and Slate 300 (`#cbd5e1`) for interactive input borders.
- **System Feedback**:
  - Success / Cryptographic Verification: Emerald (`#10b981`), paired with Emerald 50 (`#ecfdf5`) backgrounds.
  - Critical / Revocation: Rose (`#ef4444`), paired with Rose 50 (`#fff1f2`) backgrounds.
  - Advisory / Warning: Amber (`#f59e0b`), paired with Amber 50 (`#fffbeb`) backgrounds.

## Typography

The type system is standardized on `Geist` to achieve crisp micro-legibility in information-dense views such as legal audit logs, signature tables, and metadata panels. Headings utilize deliberate negative tracking (`-0.02em` to `-0.025em`) to impart an editorial, engineered authority reminiscent of high-end financial systems. Body and interactive labels preserve balanced spacing and neutral line heights to maintain effortless scanning during prolonged document review. 

Monospaced information—such as SHA-256 document checksums, transaction hashes, and IP audit trails—leverages `JetBrains Mono` at `code-sm` to ensure accurate character comparison.

## Layout & Spacing

The layout is built around a standard 12-column responsive fluid grid with fixed maximum container widths (`1280px` for desktop dashboards, `1440px` for dense data workspaces).

- **Grid Mechanics**: Desktop viewports use a 24px (`1.5rem`) gutter with 32px (`2rem`) outer margin. Mobile screens collapse to a 4-column system with 16px (`1rem`) gutters and margins.
- **Rhythm**: Component spacing strictly adheres to an 8px base rhythm (`0.5rem`), using 4px (`0.25rem`) increments only for dense form alignments and micro-badges.
- **Layout Zones**: The default interface partitions into a fixed-width left navigation rail (`240px` expanded, `64px` collapsed), a persistent workspace header (`56px` height), and a flexible central document canvas.

## Elevation & Depth

This system avoids dramatic dropshadows or heavy blur layers. Depth is communicated through structural layering, border containment, and restrained micro-shadows:

- **Level 0 (Flat Canvas)**: Neutral surface `#f8fafc` or pure `#ffffff` bordered by 1px solid `#e2e8f0`.
- **Level 1 (Card & Section Containers)**: White `#ffffff` background with 1px solid `#e2e8f0` and an ultra-subtle base shadow: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Popovers, Dropdowns, Flyouts)**: White `#ffffff` background, 1px solid `#e2e8f0`, elevated with `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals & Critical Dialogs)**: Centered over an opaque backdrop overlay (`rgba(15, 23, 42, 0.4)`), elevated with `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.

## Shapes

The interface uses a controlled, geometric shape language configured at roundedness level 1:
- Inputs, buttons, and micro-elements use an exact `6px` radius (`rounded-md`).
- Content cards, document preview containers, and modal dialogs use an `8px` radius (`rounded-lg`).
- Status tags and cryptographic badge indicators maintain `4px` (`rounded-sm`) to keep metadata tags architectural rather than playful.
- Pill or circular geometry is restricted strictly to user avatars and circular progress counters.

## Components

### Buttons
- **Primary**: Solid Indigo (`#4f46e5`), white text (`#ffffff`), `6px` border radius, font `label-md`. Subtle hover state (`#4338ca`), active press (`#3730a3`). Shadows match `0 1px 2px 0 rgba(0, 0, 0, 0.05)`.
- **Secondary / Outline**: 1px solid `#e2e8f0`, white `#ffffff` background, Slate 800 (`#1e293b`) text. Hover introduces `#f8fafc` surface and `#cbd5e1` border.
- **Destructive**: Rose 50 (`#fff1f2`) background, Rose 600 (`#e11d48`) text, 1px solid Rose 200 (`#fecdd3`). Hover shifts to Rose 600 text over Rose 100 (`#ffe4e6`).

### Input Fields & Controls
- **Text Inputs**: Height `38px`, background `#ffffff`, border 1px solid `#cbd5e1`, text Slate 900 (`#0f172a`), placeholder Slate 400 (`#94a3b8`).
- **Focus State**: 1px solid Indigo 600 (`#4f46e5`) paired with a high-accessibility outer ring: `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15)`.
- **Checkboxes & Radios**: `16px x 16px`, border 1px solid `#cbd5e1`, 4px radius for checkboxes, full circle for radios. Checked state fills with Indigo 600 with a white checkmark icon.

### Cards & Panels
- **Structure**: White `#ffffff` background, 1px solid `#e2e8f0`, 8px border radius, subtle micro-shadow.
- **Header Separator**: Internal header regions are separated by a 1px solid `#f1f5f9` horizontal rule with `space-md` internal padding.

### Chips & Status Badges
- **Verified / Sealed**: Emerald 50 (`#ecfdf5`) background, Emerald 700 (`#047857`) text, 1px solid Emerald 200 (`#a7f3d0`). Includes an optional 6px solid Emerald indicator dot.
- **Pending / In Review**: Amber 50 (`#fffbeb`) background, Amber 700 (`#b45309`) text, 1px solid Amber 200 (`#fde68a`).
- **Restricted / Expired**: Slate 100 (`#f1f5f9`) background, Slate 600 (`#475569`) text, 1px solid Slate 200 (`#e2e8f0`).

### Tables & Document Lists
- **Data Rows**: Height `48px`, border-bottom 1px solid `#f1f5f9`. Hover activates `#f8fafc`.
- **Header Cells**: Height `36px`, background `#f8fafc`, typography `label-sm`, color Slate 500 (`#64748b`), text-transform uppercase, tracking `0.05em`.

### Domain-Specific Components
- **Audit Signature Strip**: A compact verification widget displaying signer identity, timestamp, and verification hash in `code-sm` font with a 1px solid `#e2e8f0` containment box.
- **Secure File Dropzone**: Dashed 1.5px border in Slate 300 (`#cbd5e1`), `#f8fafc` background, transitioning to Indigo 500 border and Indigo 50 (`#eef2ff`) background on drag hover.