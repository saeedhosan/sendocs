import { describe, expect, it } from 'vitest'
import { evaluatePasswordStrength, passwordRequirements } from '../../../src/lib/password'

describe('evaluatePasswordStrength', () => {
  it('flags an empty value as too short', () => {
    expect(evaluatePasswordStrength('')).toEqual({
      score: 0,
      label: 'Too short',
    })
  })

  it('flags anything under 8 characters as too short', () => {
    expect(evaluatePasswordStrength('short').score).toBe(1)
    expect(evaluatePasswordStrength('seven77').score).toBe(1)
  })

  it('treats an 8-character password as standard', () => {
    expect(evaluatePasswordStrength('aaaaaaaa')).toEqual({
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
    expect(byId['min-length'].test('1234567')).toBe(false)
    expect(byId['min-length'].test('12345678')).toBe(true)
  })

  it('requires a letter and a number or symbol', () => {
    expect(byId['composition'].test('abcdef')).toBe(false)
    expect(byId['composition'].test('abc123')).toBe(true)
    expect(byId['composition'].test('abc!')).toBe(true)
  })
})
