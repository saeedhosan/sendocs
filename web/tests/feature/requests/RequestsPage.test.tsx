import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../src/lib/api/client'
import { requestsApi } from '../../../src/features/requests/api'
import { RequestsPage } from '../../../src/features/requests/pages/RequestsPage'
import type { RequestSummary } from '../../../src/features/requests/types'

const { logout } = vi.hoisted(() => ({
  logout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../src/app/providers/useAuth', () => ({
  useAuth: () => ({ logout }),
}))

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

const list = vi.mocked(requestsApi.list)

const request: RequestSummary = {
  id: 'r1',
  title: '2024 Corporate Tax Return',
  status: 'waiting',
  uploaded: 2,
  total: 5,
  lastActivityAt: '2026-06-01T11:00:00Z',
  createdAt: '2026-06-01T10:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  revokedAt: null,
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <RequestsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  list.mockReset()
})

describe('RequestsPage', () => {
  it('shows the empty state when there are no requests', async () => {
    list.mockResolvedValue({ data: [], nextCursor: null })
    renderPage()

    expect(
      await screen.findByText('No document requests yet'),
    ).toBeInTheDocument()
  })

  it('renders the request list with progress', async () => {
    list.mockResolvedValue({ data: [request], nextCursor: null })
    renderPage()

    expect(
      await screen.findByText('2024 Corporate Tax Return'),
    ).toBeInTheDocument()
    expect(screen.getByText('2 of 5 uploaded')).toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    list
      .mockRejectedValueOnce(new ApiError('internal_error', 'Boom.', 500))
      .mockResolvedValueOnce({ data: [request], nextCursor: null })

    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByText('We could not load your requests.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))

    expect(
      await screen.findByText('2024 Corporate Tax Return'),
    ).toBeInTheDocument()
  })

  it('pages forward with the cursor', async () => {
    list
      .mockResolvedValueOnce({ data: [request], nextCursor: 'c2' })
      .mockResolvedValueOnce({
        data: [{ ...request, id: 'r2', title: 'Second page request' }],
        nextCursor: null,
      })

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('2024 Corporate Tax Return')
    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => {
      expect(list).toHaveBeenLastCalledWith({ limit: 20, cursor: 'c2' })
    })
    expect(
      await screen.findByText('Second page request'),
    ).toBeInTheDocument()
  })
})
