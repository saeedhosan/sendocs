# Frontend - Technical Design

The application renders multiple views and surfaces, including the owner dashboard, client portal, landing page, and modals, while receiving data and creating resources through REST APIs.

Shared rendering, data loading, and responsive behaviour are defined here; surface-specific behaviour remains in their respective feature documents.

Both React applications require JavaScript and show an explicit failure state if the bundle or initial load fails.

## Scope

### In Scope

- The rendering strategy for each surface.
- How a page receives its data on first load.
- How the CSRF token and the portal token are delivered and held.
- Asset and runtime configuration policy.
- The headers the UI is required to send.
- Responsive rules, defined once for both surfaces.

### Out of Scope

- All screens, pages, and UI states, defined in docs/features/\*.md under UX and UI.
- Also covered endpoint semantics and validation in those files docs/features/\*.md.
- Token security, expiry, and revocation, covered by features/secure-magic-link.md.
- Sessions, cookies, and passwords, covered by features/auth-and-access.md.
- Frontend framework, decided in TD-005 of decisions.md.
- Design system, branding, and copy.

## Decisions

**Rendering**

- Choice: React renders every view on both surfaces.
- Rejected: Server-rendered pages.
- Why: One model for both surfaces, and live state is the point of both screens.

**Origin**

- Choice: One origin for UI and API.
- Rejected: Separate hosts with CORS.
- Why: A second origin adds security overhead without a clear benefit.

**First Load**

- Choice: Both apps boot, then fetch from the API.
- Rejected: Data embedded in the shell.
- Why: The shell is the same file for every route, so it carries no user data.

**CSRF Token**

- Choice: Fetched from the API on boot and held in memory.
- Rejected: A readable cookie.
- Why: The session call already returns it, so a second copy is redundant.

**Portal Token**

- Choice: Read from the path once and held in memory.
- Rejected: A cookie or browser storage.
- Why: No ambient credential and nothing left on a shared device.

**Assets**

- Choice: Self-hosted from our own origin.
- Rejected: Third-party assets or CDN.
- Why: No page load should report an owner or client outward.

**Cookies**

- Choice: Session cookie for the dashboard; none for the portal.
- Rejected: One cookie policy for both.
- Why: The portal credential is in the URL, so a cookie only adds risk.

**Framework**

- Choice: React on both surfaces, with every view rendered in the browser.
- Rejected: No framework or Vue.
- Why: Upload state and refreshes are easier to manage, and the ecosystem is wide.

## Rendering

- React renders every view on both surfaces, using one screen model.
- Both apps load the static shell, then fetch data.
- The shell contains no user data, so caching is safe.
- Both apps share components and load no third-party assets.
- Route guards run when each owner route resolves.
- If screen docs disagree, this document decides how the route renders.

## Data States

- Both apps fetch after boot, so the first paint is loading.
- The shared shell contains no user-specific data.
- The portal fetches using the token read from the path.
- The CSRF token is fetched on boot and held in memory, never in a cookie.
- The portal token is read once and never persisted, queried, or pushed to history.
- Downloads navigate directly to signed URLs; file bytes never enter the app.
- Refetch rules belong to screen docs: on focus and after writes, never on a timer.

## Load Assets

- Fonts, icons, and scripts are self-hosted; no CDN or external services.
- Content-hashed filenames allow long asset caching.
- Environment-specific values are injected at runtime, never baked into builds.
- Published limits come from the API contract, so changes need no UI rebuild.
- No secrets appear in builds or runtime payloads.
- CI builds both bundles; the server only serves them.
- Unknown dashboard or portal paths return the app shell for deep links.

## Responsive

- Three named widths: small, medium, and large.
- Layouts start small and widen; no separate mobile page.
- Each surface has one layout change, not a redesign.
- Nothing depends on hover; all actions work with touch.
- Touch targets are at least 44px where appropriate.
- Long content scrolls within its row; the page never scrolls sideways.
- Dialogs become full sheets at small widths.
- Page size remains a server-side decision.
- Orientation changes preserve form state and uploads.
- Layout responds to viewport size, never user-agent strings.

## Security

- HTTPS only, with HSTS.
- CSP allows no external sources on any surface.
- Strict referrer policy, mandatory for the portal.
- Framing denied, MIME sniffing disabled, and no inline scripts or handlers.

## Trade-offs

**One Rendering Model**

- Benefit: one rendering model and shared UI across both surfaces.
- Cost: first paint is loading, and JavaScript is required.
- Rejected server-rendered pages to avoid two rendering models.

**Data Fetched After Boot**

- Benefit: one cacheable shell with no user data.
- Cost: every screen waits for a fetch.

**Self-Hosted Assets**

- Benefit: no third-party origin observes users and fewer failure points.
- Cost: we serve the assets ourselves.

**Three Fixed Widths**

- Benefit: one shared responsive rule set with three testable widths.
- Cost: unusual viewports use the nearest width.
- Rejected continuous breakpoints as unnecessary for this UI.

## Open Questions

**Shared Code**

- Both apps use React and can share components, escaping, and formatting.
- Open: one bundle or a shared package built into each app?
- Option: One bundle for both surfaces.
- Option: Shared package with separate app bundles.

**Server Fallback**

- Deep links need the server to return the app shell for unknown paths.
- Open: one fallback or separate portal handling?
- Option: One fallback for both surfaces.
- Option: Separate portal fallback to isolate token paths from shared route logs.

**Offline**

- Nothing is cached durably; a service worker would add staleness.
- Open: is offline support ever required?
- Option: Keep the app online-only.
- Option: Add offline support if a future use case requires it.
