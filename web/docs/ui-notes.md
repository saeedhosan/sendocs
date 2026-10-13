# UI notes (web)

The web app uses [shadcn/ui](https://ui.shadcn.com) as its component system.

## Where things live

- `src/components/ui/` — **stock shadcn components**, lowercase, vendor
  additions only. Add/replace them with the CLI only:
  ```bash
  bunx --bun shadcn@latest add <component>   # inside web/
  ```
  `components.json` points `aliases.ui` at `@/components/ui`.
- `src/components/` — custom components that are not shadcn primitives. They
  compose shadcn pieces and follow the same convention as the rest of the app:
  - `PageHeader.tsx` — page title / back link / actions header.
  - `PasswordInput.tsx` — `Input` with a show/hide toggle (the documented
    shadcn "password input" pattern).
  - `ThemeToggle.tsx` — light/dark/system switcher.

## Import style

Import at the component level with the `@/` alias; list named exports on
multiple lines:

```ts
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
```

Never import from a barrel — there is no `components/ui/index.ts` anymore;
each shadcn component is imported from its own module.

## Using shadcn native APIs

- **Button** variants: `default` (primary action) is the plain button;
  destructive actions use `destructive` (shadcn's reddish-tinted button),
  and `secondary`/`ghost`/`outline`/`link` are available directly.

### Cursor behaviour (deliberate deviation)

Buttons and links are `cursor: pointer` by default; disabled buttons are
`cursor: not-allowed`. This is enforced in two places:

- `ui/button.tsx` — the `buttonVariants` base adds `cursor-pointer` to every
  variant and uses `disabled:cursor-not-allowed` in place of stock shadcn's
  `disabled:pointer-events-none` (so the disabled style is visible; the native
  `disabled` attribute still blocks activation).
- `styles/global.css` `@layer base` — a global `a { cursor: pointer }` and
  `button:not(:disabled)`/`:disabled` rules as a backstop for non-shadcn
  buttons and plain links.
- **Icons in buttons**: pass the icon as the first/last child with
  `data-icon="inline-start"` / `data-icon="inline-end"` so the padding
  adjusts. Icons without a size class are set to `size-4` by the button.
- **Loading buttons**: render `<Spinner data-icon="inline-start" />` as the
  first child and set `disabled`, so the button is inert while work runs.
- **Alerts**: use the stock variants — `variant="destructive"` for errors,
  otherwise the default neutral alert. Do not layer custom colour classes on
  top; the component already ships the styling callers need.
- **Progress**: use stock `Progress` with `value` and `aria-label`; the
  indicator colour is the theme default. There is no `ProgressBar` wrapper or
  `tone` prop.
- **Pagination**: the requests list uses the stock `Pagination` composition
  (`PaginationPrevious` / `PaginationNext`). Navigation is cursor-based and
  client-side, so the links bind `onClick` and signal the no-more-pages state
  with `aria-disabled` (`aria-disabled:pointer-events-none
  aria-disabled:opacity-50`); there is no numbered page list.
- **Badges**: same idea — `variant="outline"` plus colour classes for the
  app's semantic states.
- **Links as buttons**: use `buttonVariants` from `@/components/ui/button`,
  e.g. `className={buttonVariants({ variant: "ghost", size: "sm" })}` on a
  react-router `Link`.

## Linting

`eslint.config.js` ignores `src/components/ui` wholesale: vendored shadcn
files export constants (`buttonVariants`, `badgeVariants`) besides components,
which trips `react-refresh/only-export-components`. Vendored code is regenerated
by the CLI, not hand-edited — except `button.tsx`, which carries the cursor
deviation above (re-apply it after a CLI upgrade). `.agents/` (the shadcn agent
skill) is also ignored.

## Styles

`src/styles/` is split three ways; `src/styles/index.css` is the entry imported
by `src/main.tsx` and does nothing but control import order:

- `index.css` — imports Tailwind, `tw-animate-css`, `shadcn/tailwind.css`, the
  Geist fontsource package, then `tokens.css` and `global.css` (brand definitions
  must come last so they win). `components.json` points its `css` field here.
- `tokens.css` — the Sendocs `:root` tokens (indigo `--color-primary`, slate
  borders/ink text, `--color-danger`/`success`/`warning`/`info` palette), the
  `.dark` overrides, the `dark` custom variant, and the `@theme` bridge.
- `global.css` — `@font-face`, element resets, view-transition keyframes,
  scrollbar, and the `@layer base` rules.

The shadcn unprefixed variables (`--primary`, `--background`, `--border`, …) are
**aliases of the brand tokens**, declared once in `:root` inside `tokens.css`;
because the brand tokens are redefined under `.dark`, the aliases resolve to the
active theme on their own (no second shadcn block in `.dark`). This is the single
source of truth — never hard-code `oklch` neutrals for these tokens, or light and
dark drift apart. Body theming goes through the shadcn `@layer base` rule
(`bg-background text-foreground`); the plain `body` rule only sets metrics.
Typography is Geist, the shadcn default.

## Removing components

Unused shadcn components are simply deleted (`ui/form.tsx`, `ui/sonner.tsx`,
etc.); the CLI re-adds them later. Do not keep dead vendored files.