import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback'
import { ProgressBar, Spinner } from '../../../components/ui'
import { ApiError } from '../../../lib/api/client'
import { portalApi } from '../api'
import { CompleteBanner } from '../components/CompleteBanner'
import { DeadLinkScreen } from '../components/DeadLinkScreen'
import { PortalHeader } from '../components/PortalHeader'
import { PortalItemRow } from '../components/PortalItemRow'
import { progressLabel, remainingLabel, uploadPercent } from '../progress'
import { useUploadQueue } from '../useUploadQueue'
import type { PortalView } from '../types'
import styles from './PortalPage.module.css'

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
    return <DeadLinkScreen />
  }

  if (status === 'error') {
    return (
      <div className={styles.fallback}>
        <ErrorState
          title="We could not load this page"
          message="Check your connection and try again."
          action={
            <button
              type="button"
              className={styles.retry}
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
      <div className={styles.fallback}>
        <Spinner size={24} label="Loading your documents" />
      </div>
    )
  }

  const complete = view.status === 'complete'
  const remaining = view.total - view.uploaded

  return (
    <div className={styles.page}>
      <PortalHeader />

      <main className={styles.main}>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>

        <section className={styles.intro}>
          <h1 className={styles.title}>{view.title}</h1>
          <p className={styles.lede}>Please upload each requested document.</p>

          <div className={styles.progress}>
            <div className={styles.progressTop}>
              <h2 className={styles.progressLabel}>
                {progressLabel(view.uploaded, view.total)}
              </h2>
              <span className={styles.remaining}>
                {remainingLabel(remaining)}
              </span>
            </div>
            <ProgressBar
              value={uploadPercent(view.uploaded, view.total)}
              tone={complete ? 'complete' : 'waiting'}
              label={progressLabel(view.uploaded, view.total)}
            />
          </div>
        </section>

        {complete ? (
          <CompleteBanner uploaded={view.uploaded} total={view.total} />
        ) : null}

        <ul className={styles.list} aria-label="Required documents">
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
      </main>

      <footer className={styles.footer}>
        <span>© 2026 Sendocs</span>
        <span className={styles.footerDivider} aria-hidden="true">
          ·
        </span>
        <Link to="/terms" className={styles.footerLink}>
          Terms
        </Link>
        <span className={styles.footerDivider} aria-hidden="true">
          ·
        </span>
        <Link to="/privacy" className={styles.footerLink}>
          Privacy
        </Link>
      </footer>
    </div>
  )
}
