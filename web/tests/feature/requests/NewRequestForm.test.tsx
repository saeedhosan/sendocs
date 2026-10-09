import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../src/lib/api/client'
import { ITEM_LIMIT } from '../../../src/features/requests/schemas'
import { NewRequestForm } from '../../../src/features/requests/components/NewRequestForm'

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter>
      <NewRequestForm onSubmit={onSubmit} />
    </MemoryRouter>,
  )
  return onSubmit
}

describe('NewRequestForm', () => {
  it('starts with one item and reports the counter', () => {
    renderForm()
    expect(screen.getByText(`1/${ITEM_LIMIT}`)).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
  })

  it('adds and removes items', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /add document|add item/i }))
    expect(screen.getByText(`2/${ITEM_LIMIT}`)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /remove/i })[1])
    expect(screen.getByText(`1/${ITEM_LIMIT}`)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /remove/i })).toBeDisabled()
  })

  it('never allows more than ten items', async () => {
    const user = userEvent.setup()
    renderForm()

    const addButton = screen.getByRole('button', { name: /add document|add item/i })
    for (let i = 1; i < ITEM_LIMIT; i += 1) {
      await user.click(addButton)
    }

    expect(screen.getByText(`${ITEM_LIMIT}/${ITEM_LIMIT}`)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /add document|add item/i }),
    ).not.toBeInTheDocument()
  })

  it('blocks submission until required fields are filled', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('button', { name: /create request/i }))

    expect(await screen.findByText('Enter a title.')).toBeInTheDocument()
    expect(screen.getByText('Enter an item name.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.type(screen.getByLabelText('Title'), '  Tax return  ')
    await user.type(screen.getByLabelText('Document 1'), '  W-2  ')
    await user.click(screen.getByRole('button', { name: /create request/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Tax return',
        items: [{ label: 'W-2' }],
      })
    })
  })

  it('preserves input and maps API field errors', async () => {
    const user = userEvent.setup()
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError('validation_failed', 'The given data was invalid.', 422, {
          items: 'Too many items.',
        }),
      )

    renderForm(onSubmit)

    await user.type(screen.getByLabelText('Title'), 'Tax return')
    await user.type(screen.getByLabelText('Document 1'), 'W-2')
    await user.click(screen.getByRole('button', { name: /create request/i }))

    expect(await screen.findByText('Too many items.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('Tax return')
  })
})
