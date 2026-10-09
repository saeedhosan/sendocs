import { describe, expect, it } from 'vitest'
import { evaluatePasswordStrength, passwordRequirements } from '../../../src/lib/password'

describe('evaluatePasswordStrength', () => {
  it('flags an empty value as too short', () => {
    expect(evaluatePasswordStrength('')).toEqual({
      score: 0,
      label: 'Too short',
    })
  })

  it('flags anything under 12 characters as too short', () => {
    expect(evaluatePasswordStrength('short').score).toBe(1)
    expect(evaluatePasswordStrength('elevenchars').score).toBe(1)
  })

  it('treats a 12-character password as standard', () => {
    expect(evaluatePasswordStrength('aaaaaaaaaaaa')).toEqual({
      score: 2,
      label: 'Standard',
    })
  })

  it('rewards length, mixed case and symbols', () => {
    expect(evaluatePasswordStrength('abcdefghijklmnop').label).toBe('Strong')
    expect(evaluatePasswordStrength('Abcdefghijklmnop').label).toBe('Very strong')
    expect(evaluatePasswordStrength('Abcdefghijklmnop!').label).toBe('Very strong')
  })

  it('never exceeds a score of 4', () => {
    expect(evaluatePasswordStrength('Abcdefghijklmnop!@#$%').score).toBe(4)
  })
})

describe('passwordRequirements', () => {
  const byId = Object.fromEntries(
    passwordRequirements.map((requirement) => [requirement.id, requirement]),
  )

  it('mirrors the contract length rule', () => {
    expect(byId['min-length'].test('12345678901')).toBe(false)
    expect(byId['min-length'].test('123456789012')).toBe(true)
    expect(byId['max-length'].test('a'.repeat(200))).toBe(true)
    expect(byId['max-length'].test('a'.repeat(201))).toBe(false)
  })
})
