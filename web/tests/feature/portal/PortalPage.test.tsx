import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../src/lib/api/client'
import { portalApi } from '../../../src/features/portal/api'
import { PortalPage } from '../../../src/features/portal/pages/PortalPage'
import type { PortalView } from '../../../src/features/portal/types'

vi.mock('../../../src/features/portal/api', () => ({
  portalApi: { view: vi.fn(), upload: vi.fn() },
}))

const viewMock = vi.mocked(portalApi.view)
const uploadMock = vi.mocked(portalApi.upload)

const token = 'a'.repeat(43)

function makeView(overrides: Partial<PortalView> = {}): PortalView {
  return {
    title: 'Documents for Corporate Onboarding',
    status: 'waiting',
    uploaded: 0,
    total: 3,
    lastActivityAt: null,
    expiresAt: '2099-01-01T00:00:00Z',
    items: [
      { id: 'i1', label: 'Passport or Government ID', position: 1, state: 'waiting', file: null },
      { id: 'i2', label: 'Certificate of Incorporation', position: 2, state: 'waiting', file: null },
      { id: 'i3', label: 'Recent Bank Statement', position: 3, state: 'waiting', file: null },
    ],
    ...overrides,
  }
}

function uploadedView(): PortalView {
  return makeView({
    status: 'waiting',
    uploaded: 1,
    items: [
      {
        id: 'i1',
        label: 'Passport or Government ID',
        position: 1,
        state: 'uploaded',
        file: {
          originalName: 'passport_scan.pdf',
          sizeBytes: 2048,
          uploadedAt: '2026-06-01T10:00:00Z',
        },
      },
      { id: 'i2', label: 'Certificate of Incorporation', position: 2, state: 'waiting', file: null },
      { id: 'i3', label: 'Recent Bank Statement', position: 3, state: 'waiting', file: null },
    ],
  })
}

function renderPortal() {
  return render(
    <MemoryRouter initialEntries={[`/portal/${token}`]}>
      <Routes>
        <Route path="/portal/:token" element={<PortalPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function inputFor(label: string) {
  return screen.getByLabelText(`Choose a file for ${label}`)
}

function file(name: string, type = 'application/pdf', size = 2048): File {
  const value = new File(['contents'], name, { type })
  Object.defineProperty(value, 'size', { value: size })
  return value
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  viewMock.mockReset()
  uploadMock.mockReset()
})

describe('PortalPage', () => {
  it('renders the title and every required item', async () => {
    viewMock.mockResolvedValue(makeView())
    renderPortal()

    expect(
      await screen.findByRole('heading', {
        name: 'Documents for Corporate Onboarding',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Passport or Government ID')).toBeInTheDocument()
    expect(screen.getByText('Certificate of Incorporation')).toBeInTheDocument()
    expect(screen.getByText('Recent Bank Statement')).toBeInTheDocument()
    expect(screen.getByText('0 of 3 uploaded')).toBeInTheDocument()
  })

  it('shows the one dead-link screen for a 410, with no request data', async () => {
    viewMock.mockRejectedValue(
      new ApiError('invalid_link', 'This link is no longer valid.', 410),
    )
    renderPortal()

    expect(
      await screen.findByText('This link is no longer active'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Documents for Corporate Onboarding'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Passport or Government ID')).not.toBeInTheDocument()
  })

  it('uploads a chosen file and marks the row done', async () => {
    viewMock.mockResolvedValue(makeView())
    uploadMock.mockResolvedValue(uploadedView())
    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Passport or Government ID')
    await user.upload(inputFor('Passport or Government ID'), file('passport_scan.pdf'))

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledTimes(1)
    })
    expect(uploadMock.mock.calls[0][0]).toBe(token)
    expect(uploadMock.mock.calls[0][1]).toBe('i1')

    const row = await screen.findByText('Passport or Government ID')
    expect(
      within(row.closest('li') as HTMLElement).getByRole('status', {
        name: 'Upload complete',
      }),
    ).toBeInTheDocument()
  })

  it('rejects an oversized file locally without any network call', async () => {
    viewMock.mockResolvedValue(makeView())
    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Passport or Government ID')
    await user.upload(
      inputFor('Passport or Government ID'),
      file('big.pdf', 'application/pdf', 25 * 1024 * 1024 + 1),
    )

    expect(await screen.findByText(/larger than 25 MB/i)).toBeInTheDocument()
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('treats a 409 duplicate as success by refetching', async () => {
    viewMock.mockResolvedValueOnce(makeView()).mockResolvedValueOnce(uploadedView())
    uploadMock.mockRejectedValue(
      new ApiError('duplicate_upload', 'Already uploaded.', 409),
    )
    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Passport or Government ID')
    await user.upload(inputFor('Passport or Government ID'), file('passport_scan.pdf'))

    const row = await screen.findByText('Passport or Government ID')
    expect(
      within(row.closest('li') as HTMLElement).getByRole('status', {
        name: 'Upload complete',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/already been uploaded/i)).not.toBeInTheDocument()
  })

  it('shows a server rejection inline and offers a retry', async () => {
    viewMock.mockResolvedValue(makeView())
    uploadMock.mockRejectedValue(
      new ApiError('unsupported_type', 'Nope.', 415),
    )
    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Certificate of Incorporation')
    await user.upload(inputFor('Certificate of Incorporation'), file('scan.pdf'))

    expect(await screen.findByText(/file type is not accepted/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Try again: Certificate of Incorporation',
      }),
    ).toBeInTheDocument()
  })

  it('runs two transfers at once and queues the third', async () => {
    viewMock.mockResolvedValue(makeView())

    const first = deferred<PortalView>()
    const second = deferred<PortalView>()
    const third = deferred<PortalView>()

    uploadMock.mockImplementation((_token, itemId) => {
      if (itemId === 'i1') return first.promise
      if (itemId === 'i2') return second.promise
      return third.promise
    })

    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Passport or Government ID')

    await user.upload(inputFor('Passport or Government ID'), file('a.pdf'))
    await user.upload(inputFor('Certificate of Incorporation'), file('b.pdf'))
    await user.upload(inputFor('Recent Bank Statement'), file('c.pdf'))

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledTimes(2)
    })

    const queuedButton = screen.getByRole('button', {
      name: 'Upload: Recent Bank Statement',
    })
    expect(within(queuedButton).getByText('Queued')).toBeInTheDocument()
    expect(queuedButton).toBeDisabled()

    first.resolve(uploadedView())
    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledTimes(3)
    })
  })

  it('switches to the dead-link screen when a link dies mid-upload', async () => {
    viewMock.mockResolvedValue(makeView())
    uploadMock.mockRejectedValue(
      new ApiError('invalid_link', 'This link is no longer valid.', 410),
    )
    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Passport or Government ID')
    await user.upload(inputFor('Passport or Government ID'), file('passport_scan.pdf'))

    expect(
      await screen.findByText('This link is no longer active'),
    ).toBeInTheDocument()
  })

  it('refetches on focus and surfaces a link revoked elsewhere', async () => {
    viewMock
      .mockResolvedValueOnce(makeView())
      .mockRejectedValueOnce(
        new ApiError('invalid_link', 'This link is no longer valid.', 410),
      )
    renderPortal()

    await screen.findByText('Passport or Government ID')
    window.dispatchEvent(new Event('focus'))

    expect(
      await screen.findByText('This link is no longer active'),
    ).toBeInTheDocument()
  })

  it('never writes the token to storage or a cookie', async () => {
    viewMock.mockResolvedValue(makeView())
    uploadMock.mockResolvedValue(uploadedView())
    const user = userEvent.setup()
    renderPortal()

    await screen.findByText('Passport or Government ID')
    await user.upload(inputFor('Passport or Government ID'), file('passport_scan.pdf'))

    const stored = Object.keys(window.localStorage).map(
      (key) => localStorage.getItem(key) ?? '',
    )
    expect(stored.some((value) => value.includes(token))).toBe(false)
    expect(document.cookie.includes(token)).toBe(false)
  })
})
