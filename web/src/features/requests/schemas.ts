import { z } from 'zod'
import type { ZodError } from 'zod'
import type { CreateRequestInput } from './types'

export const ITEM_LIMIT = 10

/*
 * Mirrors api/docs/openapi.yaml: title 1..200, 1..10 items, each label 1..200.
 * The item count and label rules are also enforced by the API, so the client
 * only shortens the feedback loop.
 */
export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title.')
    .max(200, 'Title must be 200 characters or fewer.'),
  items: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, 'Enter an item name.')
          .max(200, 'Item name must be 200 characters or fewer.'),
      }),
    )
    .min(1, 'Add at least one item.')
    .max(ITEM_LIMIT, `Add no more than ${ITEM_LIMIT} items.`),
})

/** Turn a Zod error into a flat `path -> message` map (`items.0.label`). */
export function requestFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    const key = issue.path.join('.')

    if (key && !(key in errors)) {
      errors[key] = issue.message
    }
  }

  return errors
}

export function toCreateRequestInput(
  title: string,
  labels: string[],
): CreateRequestInput {
  return {
    title: title.trim(),
    items: labels.map((label) => ({ label: label.trim() })),
  }
}
