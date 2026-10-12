# DocCollect visual theme adoption plan

Reference inspected: [doccollect.saeedhosan.com](https://doccollect.saeedhosan.com/) on desktop (1440px), tablet (768px), and mobile (390px), 2026-10-12.

## Goal and boundaries

Adopt the reference site's visual language across the Sendocs React application: typography, color, surfaces, spacing rhythm, borders, radii, elevation, and responsive treatment. Keep Sendocs' routes, copy, forms, data, API calls, auth rules, loading/error/empty states, and interactions as they are. The reference's waitlist, pricing, signature, and reminder content is not Sendocs functionality and should not be copied into the product.

The reference is a marketing site; Sendocs also has dense authenticated workflows. Reuse the same visual tokens and component treatments, while keeping dashboard tables, forms, and portal upload states suitably compact and usable. This is a visual restyle, not a page-structure rewrite.

## Reference visual system

- **Typeface:** Inter, sans-serif; body is 16px / 24px, with regular 400, medium 500, semibold 600, bold 700, and extra-bold 800 weights. Large marketing headings use 700–800 weight, tight tracking, and about 1.1 line-height. The Sendocs app currently bundles Geist and Geist Mono; replace or supplement these with locally served Inter assets, and retain a monospace face only where filenames, tokens, or technical metadata benefit from it.
- **Core colors:** white `#ffffff` surfaces; gray text around `#1f2937` and `#111827`; secondary text around `#4b5563`; muted text around `#6b7280`; light border `#e5e7eb`; pale bands around `#f9fafb` / `#f3f4f6`.
- **Brand:** Tailwind indigo scale, including `#4f46e5` (600), `#4338ca` (700), and `#3730a3` (800), with pale indigo `#eef2ff` and `#e0e7ff`. The reference uses solid indigo buttons and occasional indigo gradients for hero emphasis and high-emphasis CTA areas.
- **Feedback accents:** green `#22c55e` for success and check marks; feature tiles also use restrained blue, violet, amber, rose, and teal tints. Keep status meaning clear and avoid using accent color as decoration on every control.
- **Shapes and depth:** compact rounded controls/cards (roughly 8–12px radius), light gray borders, and soft shadows on elevated/high-emphasis surfaces. Most content cards remain white and low-contrast; reserve stronger shadow and color for primary actions and selected pricing/CTA-like elements.
- **Layout rhythm:** centered max-width content (about 1088px at desktop), broad section padding, generous hero whitespace, and consistent 16/24/32px component gaps. Feature cards use a responsive 1/2/3-column grid; multi-step flows stack vertically on narrow screens. The header is sticky with a translucent white background and backdrop blur.
- **Responsive behavior:** desktop uses broad centered sections and multi-column layouts; tablet reduces columns and outer gutters; mobile stacks content and cards, keeps actions reachable, prevents horizontal scrolling, and reduces heading size while preserving hierarchy.

These are observed visual values, not a claim that the reference uses a formal token package. Where a value is approximate, validate it against screenshots before implementation.

## Current Sendocs touchpoints

- `src/styles/tokens.css` is the shared token source. It currently defines Geist, indigo/slate tokens, app radii, shadows, and marketing-specific success/text variables.
- `src/styles/global.css` establishes Geist, 14px / 20px global text, focus outlines, and base page styles.
- `src/styles/tailwind.css` maps CSS variables to Tailwind utilities.
- `src/layouts/PublicLayout.tsx`, `AuthLayout.tsx`, and `OwnerLayout.tsx` set page shell backgrounds and sizing. `PublicHeader.tsx`, `PublicFooter.tsx`, and `OwnerHeader.tsx` own shared navigation chrome.
- Marketing pages/components live in `src/features/landing/`; auth in `src/features/auth/`; owner requests/dashboard in `src/features/requests/`; client upload flow in `src/features/portal/`.
- Route-specific custom themes live in `src/styles/tokens.css` (for example `.owner-dashboard-theme`, `.create-request-theme`, and `.request-detail-theme`). They currently change palettes independently, so those overrides need to be reconciled with the new shared palette instead of left as accidental visual exceptions.

## Proposed implementation sequence

1. **Capture a baseline.** Save screenshots for representative landing, legal, login/register, dashboard/list, create-request, request-detail, and client-portal states at 1440px, 768px, and 390px. Include menus, validation, loading, empty, error, and success states that already exist. Record current route behavior and computed typography/color values.
2. **Define the design tokens once.** Update `tokens.css` with named Inter/font, neutral, indigo, surface, border, feedback, radius, shadow, and spacing values based on the reference. Load Inter from a checked-in font asset where licensing and available assets permit; do not make rendering depend on a third-party font request. Keep a deliberate monospace token for technical metadata. Update Tailwind's variable bridge only where new utilities require it.
3. **Normalize foundations and shared controls.** Update global typography and focus treatment, then align shared buttons, links, inputs, cards, badges, notices, progress indicators, and dialogs. Preserve accessible contrast, keyboard focus, disabled states, validation affordances, and target sizes. Avoid embedding page-specific styling into generic controls.
4. **Restyle shared shells.** Align public/auth headers and footers with the reference's white/translucent navigation, indigo emphasis, and neutral canvas. Apply the same brand colors, type, card treatment, and spacing to owner and portal shells, but retain route-specific content and the compact density needed for work screens. Remove or narrow theme overrides only after checking every route that consumes them.
5. **Restyle page families in small, reviewable slices.** Start with landing and public legal pages, then authentication, owner dashboard/request flows, and client portal. Preserve text exactly as currently defined by Sendocs and retain all existing loading/error/empty and authenticated/guest branches. Reuse shared components when a visual rule is repeated.
6. **Compare and refine responsively.** For each slice, compare screenshots side by side at desktop, tablet, and mobile. Check section and component bounds, computed font family/size/weight/line-height, colors, borders, radii, shadows, gutters, wrapping, overflow, and focus/hover/pressed/disabled states. A visual mismatch at one width must not be fixed by breaking another.
7. **Validate and commit incrementally.** Run the relevant web lint/typecheck, tests, and production build for each completed slice. Review the diff for route/API/behavior changes. Commit each completed page or page family with a focused message, then open/update the phase pull request with the pages changed, screenshots or comparison notes, checks, and commit references.

## Acceptance checklist

- Shared text uses Inter and a consistent reference-based type scale; headings keep the strong, tight hierarchy seen on the reference.
- Indigo is the single primary-action color across public, auth, owner, and portal surfaces; neutrals and semantic status colors stay consistent.
- Shared chrome, buttons, fields, cards, status elements, and spacing follow one reusable system.
- Layouts remain responsive at 1440px, 768px, and 390px without horizontal overflow or clipped controls.
- Existing Sendocs copy, route behavior, APIs, authentication, interaction states, accessibility, and keyboard behavior remain intact.
- Every page family has screenshot comparisons and passes the relevant lint/typecheck, tests, and production build before it is considered complete.

## Decisions to settle during implementation

- Confirm whether Inter should become the global product font, including authenticated application screens, or be limited to public/auth surfaces. This plan assumes global adoption for a coherent theme.
- Select and check in the appropriate Inter font files/weights after confirming their source and license. The reference loads Inter from Google Fonts; production Sendocs should avoid relying on that external request.
- Agree whether the current per-route owner palettes should be fully removed or retained only for non-color layout distinctions. The recommended direction is one shared neutral/indigo palette, with semantic status colors unchanged.
