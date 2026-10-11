export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

/**
 * A simple strength signal for the meter in the reference designs.
 *
 * It is informational only: the contract's only rule is length, so this never
 * blocks submission by itself.
 */
export function evaluatePasswordStrength(value: string): PasswordStrength {
  if (value.length === 0) {
    return { score: 0, label: 'Too short' }
  }

  if (value.length < 12) {
    return { score: 1, label: 'Too short' }
  }

  let score = 2

  if (value.length >= 16) {
    score += 1
  }

  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    score += 1
  }

  if (/[^A-Za-z0-9]/.test(value)) {
    score += 1
  }

  const clamped = Math.min(score, 4) as PasswordStrength['score']

  const labels: Record<PasswordStrength['score'], string> = {
    0: 'Too short',
    1: 'Too short',
    2: 'Standard',
    3: 'Strong',
    4: 'Very strong',
  }

  return { score: clamped, label: labels[clamped] }
}

export type PasswordRequirement = {
  id: string
  label: string
  test: (value: string) => boolean
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'min-length',
    label: 'At least 12 characters',
    test: (value) => value.length >= 12,
  },
  {
    id: 'max-length',
    label: 'No more than 200 characters',
    test: (value) => value.length > 0 && value.length <= 200,
  },
]
