## Web UI structure

Assuming `web/` is the React application root:

```

web/src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
│
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── index.css (main)
│
├── components/
│   ├── ui/                    # Generic, reusable primitives
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── DropdownMenu.tsx
│   │   ├── Progress.tsx
│   │   ├── Spinner.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Alert.tsx
│   │   └── index.ts
│   │
│   ├── forms/                 # Shared form behavior
│   │   ├── FormField.tsx
│   │   ├── FormError.tsx
│   │   └── FormActions.tsx
│   │
│   ├── feedback/              # Loading, errors, empty states
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   └── LoadingState.tsx
│   │
│   └── navigation/
│       ├── Logo.tsx
│       ├── Breadcrumbs.tsx
│       └── UserMenu.tsx
│
├── layouts/
│   ├── PublicLayout.tsx
│   ├── AuthLayout.tsx
│   ├── OwnerLayout.tsx
│   └── components/
│       ├── PublicHeader.tsx
│       ├── PublicFooter.tsx
│       ├── OwnerHeader.tsx
│       └── OwnerNavigation.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── schemas/
│   │   └── types.ts
│   │
│   ├── requests/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── schemas/
│   │   └── types.ts
│   │
│   ├── documents/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types.ts
│   │
│   └── landing/
│       ├── components/
│       └── pages/
│
├── lib/                       # Shared infrastructure/helpers
└── types/                     # Only genuinely global types

```

## What belongs where?

| Layer                 | Responsibility                   | Examples                       |
| --------------------- | -------------------------------- | ------------------------------ |
| `components/ui`       | Reusable visual primitives       | Button, Input, Dialog          |
| `components/forms`    | Consistent form composition      | FormField with label and error |
| `components/feedback` | Common UI states                 | Empty, error, loading          |
| `layouts`             | Shared page structure            | Owner header and content shell |
| `features/*`          | Sendocs-specific behavior and UI | Request list, document upload  |
| `lib`                 | Shared non-UI utilities          | Formatting, helpers            |
| `styles`              | Design tokens and global rules   | Colors, typography, spacing    |

## The important rule: reuse at the right level

For example, `Button` should know about its variants, disabled state, and loading appearance. It should not know how to submit a document request.

```

<Button variant="primary" loading={isSubmitting}>
  Create request
</Button>

```

A feature component composes primitives into a meaningful Sendocs interface:

```

function CreateRequestForm() {
  return (
    <form>
      <FormField label="Request title" required>
        <Input
          name="title"
          placeholder="e.g. 2026 Tax Documents"
        />
      </FormField>

      <FormActions>
        <Button variant="secondary" type="button">
          Cancel
        </Button>
        <Button type="submit">Create request</Button>
      </FormActions>
    </form>
  );
}

```

These are illustrative examples, not assumptions about your current component APIs.

## Five rules to keep the codebase maintainable

1. Build when needed. Create shared components when there is a real reuse case; don't build an entire UI library upfront.
2. One source of truth. Colors, typography, spacing, radii, and shadows belong in design tokens derived from your committed designs.
3. Keep business logic in features. Generic UI components shouldn't know about API endpoints, authentication rules, or document-request workflows.
4. Avoid oversized components. Split components when they have distinct responsibilities, not simply because a file reaches a certain line count.
5. Avoid premature abstractions. Two similar screens don't automatically need a highly configurable component with dozens of props.

## Implementation order

1. Inspect the existing `web/` structure, `package.json`, and design references.
2. Establish design tokens, global styles, typography, and the chosen icon system.
3. Build the foundational primitives: Button, Input, FormField, Card, and Badge.
4. Implement login and validate the components against its reference screenshot.
5. Extend the system to account creation and password flows.
6. Build request-specific components, then the owner dashboard, request details, and client portal.

My recommendation: use a feature-oriented architecture with shared UI primitives. This gives Sendocs substantial reuse while keeping authentication, requests, documents, and landing-page code independently understandable.

One final point: before choosing additional libraries or writing implementation code, inspect what is already installed. Reuse the existing React, TypeScript, router, form, and icon dependencies where appropriate.
