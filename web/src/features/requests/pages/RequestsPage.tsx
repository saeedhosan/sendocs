import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DescriptionIcon,
  PlusIcon,
} from '../../../components/icons'
import { ApiError } from '../../../lib/api/client'
import { RequestList } from '../components/RequestList'
import { requestsApi } from '../api'
import type { RequestSummary } from '../types'
import styles from './RequestsPage.module.css'

export function RequestsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const cursor = searchParams.get('cursor')

  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [pageCursor, setPageCursor] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [canGoPrevious, setCanGoPrevious] = useState(false)
  const historyRef = useRef<Array<string | null>>([])
  const cursorRef = useRef<string | null>(cursor)

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  const load = useCallback(
    (activeCursor: string | null) => {
      return requestsApi
        .list({ limit: 20, cursor: activeCursor })
        .then((page) => {
          setRequests(page.data)
          setPageCursor(page.nextCursor)
          setStatus('ready')
        })
        .catch((error) => {
          // A rejected session is handled centrally: the shell clears it and
          // the route guard returns to sign-in.
          if (error instanceof ApiError && error.code === 'unauthenticated') {
            return
          }

          setStatus('error')
        })
    },
    [],
  )

  useEffect(() => {
    void load(cursor)
  }, [cursor, load])

  useEffect(() => {
    function onFocus() {
      void load(cursorRef.current)
    }

    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  function setCursor(next: string | null) {
    setSearchParams(next ? { cursor: next } : {}, { replace: false })
  }

  function goNext() {
    if (!pageCursor) {
      return
    }

    historyRef.current.push(cursor)
    setCanGoPrevious(true)
    setStatus('loading')
    setCursor(pageCursor)
  }

  function goPrevious() {
    if (historyRef.current.length === 0) {
      return
    }

    const previous = historyRef.current.pop() ?? null
    setCanGoPrevious(historyRef.current.length > 0)
    setStatus('loading')
    setCursor(previous)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Document Requests</h1>
          <p className={styles.subtitle}>Collect and track client documentation</p>
        </div>
        <Button
          iconLeft={<PlusIcon size={18} />}
          onClick={() => navigate('/requests/new')}
        >
          New request
        </Button>
      </div>

      {status === 'loading' && requests.length === 0 ? (
        <LoadingState title="Loading requests" />
      ) : null}

      {status === 'error' ? (
        <ErrorState
          message="We could not load your requests."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setStatus('loading')
                void load(cursor)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : null}

      {status !== 'error' && requests.length === 0 && status === 'ready' ? (
        <EmptyState
          icon={<DescriptionIcon size={24} />}
          title="No document requests yet"
          message="Create your first request link to start gathering files from clients securely."
          action={
            <Button
              iconLeft={<PlusIcon size={18} />}
              onClick={() => navigate('/requests/new')}
            >
              Create request
            </Button>
          }
        />
      ) : null}

      {requests.length > 0 ? (
        <>
          <RequestList requests={requests} />
          <div className={styles.paging}>
            <span className={styles.showing}>
              Showing {requests.length} request
              {requests.length === 1 ? '' : 's'}
            </span>
            <div className={styles.pagingButtons}>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ChevronLeftIcon size={16} />}
                onClick={goPrevious}
                disabled={!canGoPrevious}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconRight={<ChevronRightIcon size={16} />}
                onClick={goNext}
                disabled={!pageCursor}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
