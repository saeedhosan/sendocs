import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/features/requests/api', () => ({
  requestsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
    remove: vi.fn(),
    removeDocument: vi.fn(),
  },
}))

import { ApiError } from '../../../src/lib/api/client'
import { requestsApi } from '../../../src/features/requests/api'
import { RequestDetailPage } from '../../../src/features/requests/pages/RequestDetailPage'
import type { RequestDetail } from '../../../src/features/requests/types'

const get = vi.mocked(requestsApi.get)
const remove = vi.mocked(requestsApi.remove)

const request: RequestDetail = {
  id: 'r1',
  title: '2024 Corporate Tax Return',
  status: 'waiting',
  uploaded: 1,
  total: 2,
  lastActivityAt: '2026-06-01T11:00:00Z',
  createdAt: '2026-06-01T10:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  revokedAt: null,
  items: [],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/requests/r1']}>
      <Routes>
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  get.mockReset()
  remove.mockReset()
})

describe('RequestDetailPage', () => {
  it('keeps the confirmation open when a delete fails', async () => {
    get.mockResolvedValue(request)
    remove.mockRejectedValue(new ApiError('internal_error', 'Boom.', 500))

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('2024 Corporate Tax Return')
    await user.click(screen.getByRole('button', { name: 'Delete request' }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete request' }))

    expect(await screen.findByText('Boom.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the dialog once the delete succeeds', async () => {
    get.mockResolvedValue(request)
    remove.mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('2024 Corporate Tax Return')
    await user.click(screen.getByRole('button', { name: 'Delete request' }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete request' }))

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
