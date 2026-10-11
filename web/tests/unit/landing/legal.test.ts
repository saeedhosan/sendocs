import { describe, expect, it } from 'vitest'
import { privacyPolicy } from '../../../src/features/landing/content/privacyPolicy'
import { termsOfService } from '../../../src/features/landing/content/termsOfService'

describe('legal content', () => {
  it('transcribes every privacy section with non-empty content', () => {
    expect(privacyPolicy.title).toBe('Privacy Policy')
    expect(privacyPolicy.sections).toHaveLength(8)

    for (const section of privacyPolicy.sections) {
      expect(section.heading).not.toBe('')
      expect(section.blocks.length).toBeGreaterThan(0)
    }

    expect(privacyPolicy.note?.email).toBe('privacy@sendocs.io')
  })

  it('transcribes every terms section behind an intro', () => {
    expect(termsOfService.title).toBe('Terms of Service')
    expect(termsOfService.intro).toBeTruthy()
    expect(termsOfService.sections).toHaveLength(8)

    for (const section of termsOfService.sections) {
      expect(section.heading).not.toBe('')
      expect(section.blocks.length).toBeGreaterThan(0)
    }
  })
})
