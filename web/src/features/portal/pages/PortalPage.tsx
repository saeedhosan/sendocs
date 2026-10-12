import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback'
import { Container, ProgressBar, Spinner } from '../../../components/ui'
import { ApiError } from '../../../lib/api/client'
import { portalApi } from '../api'
import { CompleteBanner } from '../components/CompleteBanner'
import { CompletedItemsList } from '../components/CompletedItemsList'
import { DeadLinkScreen } from '../components/DeadLinkScreen'
import { PortalHeader } from '../components/PortalHeader'
import { PortalFooter } from '../components/PortalFooter'
import { PortalItemRow } from '../components/PortalItemRow'
import { progressLabel, remainingLabel, uploadPercent } from '../progress'
import { useUploadQueue } from '../useUploadQueue'
import type { PortalView } from '../types'

type PortalStatus = 'loading' | 'ready' | 'dead' | 'error'

/**
 * The single client-portal screen.
 *
 * The token is a credential read once from the path and held in memory only; it
 * is never written to storage, a cookie, or the query string. A `410` — for an
 * unknown, malformed, expired, revoked, or tampered link — always swaps to the
 * one dead-link screen, with nothing about the request revealed.
 */
export function PortalPage() {
  const { token = '' } = useParams()
  const [view, setView] = useState<PortalView | null>(null)
  const [status, setStatus] = useState<PortalStatus>('loading')
  const [reload, setReload] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const actionRefs = useRef(new Map<string, HTMLButtonElement>())
  const previousBusy = useRef(0)

  const handleUploaded = useCallback((next: PortalView) => {
    setView(next)
    setAnnouncement(
      next.status === 'complete'
        ? `All ${next.total} documents uploaded.`
        : `${next.uploaded} of ${next.total} uploaded.`,
    )
  }, [])

  const handleDeadLink = useCallback(() => {
    setStatus('dead')
  }, [])

  // A silent re-read used on tab focus and after a 409 duplicate.
  const refetch = useCallback(() => {
    portalApi
      .view(token)
      .then(setView)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 410) {
          setStatus('dead')
        }
      })
  }, [token])

  const { transfers, failures, queued, enqueue } = useUploadQueue({
    token,
    onUploaded: handleUploaded,
    onDuplicate: refetch,
    onDeadLink: handleDeadLink,
  })

  // Initial load, and every manual retry.
  useEffect(() => {
    const controller = new AbortController()

    portalApi
      .view(token, controller.signal)
      .then((data) => {
        setView(data)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        if (error instanceof ApiError && error.status === 410) {
          setStatus('dead')
          return
        }

        setStatus('error')
      })

    return () => controller.abort()
  }, [token, reload])

  // Revalidate on tab focus or return, so a link revoked elsewhere surfaces.
  useEffect(() => {
    if (status !== 'ready') {
      return
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    }

    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', refetch)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refetch, status])

  const busy = Object.keys(transfers).length + queued.length

  // When a batch finishes, move focus to the first item that failed.
  useEffect(() => {
    const wasBusy = previousBusy.current
    previousBusy.current = busy

    if (wasBusy === 0 || busy > 0) {
      return
    }

    const firstFailed = view?.items.find((item) => failures[item.id])

    if (firstFailed) {
      actionRefs.current.get(firstFailed.id)?.focus()
    }
  }, [busy, failures, view])

  if (status === 'dead') {
    return (
      <div className="flex flex-col min-h-screen bg-surface-muted">
        <PortalHeader />
        <Container
          as="main"
          className="flex-1 py-6 sm:py-10 md:py-12"
        >
          <DeadLinkScreen />
        </Container>
        <PortalFooter />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4 bg-surface-muted">
        <ErrorState
          title="We could not load this page"
          message="Check your connection and try again."
          action={
            <button
              type="button"
              className="min-h-9 px-4 border border-border rounded-md bg-surface text-sm font-medium text-ink cursor-pointer hover:bg-surface-muted"
              onClick={() => {
                setStatus('loading')
                setReload((value) => value + 1)
              }}
            >
              Retry
            </button>
          }
        />
      </div>
    )
  }

  if (status === 'loading' || view === null) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 px-4 bg-surface-muted">
        <Spinner size={24} label="Loading your documents" />
      </div>
    )
  }

  const complete = view.status === 'complete'
  const remaining = view.total - view.uploaded

  return (
    <div className="flex flex-col min-h-screen bg-surface-muted">
      <PortalHeader />

      <Container as="main" className="flex-1 py-6 sm:py-10 md:py-12">
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>

        {complete ? (
          <>
            <CompleteBanner uploaded={view.uploaded} total={view.total} />

            <CompletedItemsList items={view.items} />

            <p className="mt-6 text-xs text-center text-ink-muted">
              No further action is required. You may safely close this browser
              window.
            </p>
          </>
        ) : (
          <>
            <section className="mb-6">
              <h1 className="text-xl font-semibold leading-[1.4] tracking-[-0.015em] text-ink [overflow-wrap:anywhere] sm:text-2xl sm:leading-8 md:text-3xl md:leading-9">
                {view.title}
              </h1>
              <p className="mt-1 text-sm leading-5 text-ink-secondary sm:mt-1.5 sm:text-base sm:leading-6">
                Please upload each requested document.
              </p>

              <div className="mt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-1 mb-2">
                  <h2 className="text-sm font-semibold text-ink">
                    {progressLabel(view.uploaded, view.total)}
                  </h2>
                  <span className="text-[0.8125rem] text-ink-muted">
                    {remainingLabel(remaining)}
                  </span>
                </div>
                <ProgressBar
                  value={uploadPercent(view.uploaded, view.total)}
                  tone="waiting"
                  label={progressLabel(view.uploaded, view.total)}
                  className="bg-[#e2e8f0] sm:h-2"
                />
              </div>
            </section>

            <ul
              className="list-none mt-5 mb-0 p-0 border border-border rounded-[10px] bg-surface overflow-hidden"
              aria-label="Required documents"
            >
              {view.items.map((item) => (
                <PortalItemRow
                  key={item.id}
                  item={item}
                  percent={transfers[item.id]}
                  queued={queued.includes(item.id)}
                  failure={failures[item.id]}
                  onPick={enqueue}
                  actionRef={(node) => {
                    if (node) {
                      actionRefs.current.set(item.id, node)
                    } else {
                      actionRefs.current.delete(item.id)
                    }
                  }}
                />
              ))}
            </ul>
          </>
        )}
      </Container>

      <PortalFooter />
    </div>
  )
}
