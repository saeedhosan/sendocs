import { z } from 'zod'

/*
 * Client-side validation mirrors the published API contract so a field error
 * appears before a round trip. The server remains the only authority; a 422
 * still maps back onto these same field names.
 *
 * Password length is 6 to 200 characters with no composition rules, matching
 * api/docs/openapi.yaml and the ui/auth references.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .max(254, 'Email address must be 254 characters or fewer.')
  .pipe(z.email('Enter a valid email address.'))

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(200, 'Password must be 200 characters or fewer.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .max(120, 'Name must be 120 characters or fewer.'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Enter your current password.')
      .max(200, 'Password must be 200 characters or fewer.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: 'New password must be different from your current password.',
    path: ['password'],
  })

export function deleteAccountSchema(email: string) {
  return z
    .object({
      password: z
        .string()
        .min(1, 'Enter your password.')
        .max(200, 'Password must be 200 characters or fewer.'),
      confirm: emailSchema,
    })
    .refine((values) => values.confirm === email, {
      message: 'Enter your account email exactly to confirm.',
      path: ['confirm'],
    })
}

export type FieldErrors = Record<string, string>

/** Flatten a Zod error into the first message per top-level field. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}

  for (const issue of error.issues) {
    const key = issue.path[0]

    if (typeof key === 'string' && !(key in errors)) {
      errors[key] = issue.message
    }
  }

  return errors
}
