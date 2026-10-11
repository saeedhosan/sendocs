import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dialog } from '../../../src/components/ui/Dialog'
import ownerThemeStyles from '../../../src/styles/owner-themes.module.css'

describe('Dialog owner themes', () => {
  it('applies the link-reveal theme to its body-level portal', () => {
    render(
      <Dialog
        open
        onClose={() => undefined}
        title="Your request is ready."
        variant="centered"
        ownerTheme="link-reveal"
      />,
    )

    const dialog = screen.getByRole('dialog')

    expect(dialog.parentElement).toHaveClass(
      ownerThemeStyles.newRequestTheme,
      ownerThemeStyles.linkRevealTheme,
    )
  })
})
