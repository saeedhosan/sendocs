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
  const [filter, setFilter] = useState<'all' | 'waiting' | 'complete'>('all')
  const [search, setSearch] = useState('')
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

  const counts = {
    all: requests.length,
    waiting: requests.filter((request) => request.status === 'waiting').length,
    complete: requests.filter((request) => request.status === 'complete').length,
  }
  const visibleRequests = requests.filter((request) => {
    const matchesFilter = filter === 'all' || request.status === filter
    const matchesSearch = request.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesFilter && matchesSearch
  })
  const hasCompleteList =
    filter === 'all' &&
    search.trim() === '' &&
    cursor === null &&
    pageCursor === null &&
    historyRef.current.length === 0
  const showingLabel = hasCompleteList
    ? `Showing 1 to ${visibleRequests.length} of ${requests.length} requests`
    : `Showing ${visibleRequests.length} of ${requests.length} requests on this page`

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
          className={styles.newRequestButton}
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
          <div className={styles.toolbar}>
            <div className={styles.filters} aria-label="Filter requests">
              <button
                type="button"
                className={filter === 'all' ? styles.filterActive : styles.filter}
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                <span>All</span>
                <span className={styles.count}>{counts.all}</span>
              </button>
              <button
                type="button"
                className={filter === 'waiting' ? styles.filterActive : styles.filter}
                aria-pressed={filter === 'waiting'}
                onClick={() => setFilter('waiting')}
              >
                <span className={styles.waitingDot} aria-hidden="true" />
                <span>Waiting</span>
                <span className={`${styles.count} ${styles.waitingCount}`}>{counts.waiting}</span>
              </button>
              <button
                type="button"
                className={filter === 'complete' ? styles.filterActive : styles.filter}
                aria-pressed={filter === 'complete'}
                onClick={() => setFilter('complete')}
              >
                <span className={styles.completeDot} aria-hidden="true" />
                <span>Complete</span>
                <span className={`${styles.count} ${styles.completeCount}`}>{counts.complete}</span>
              </button>
            </div>
            <label className={styles.search}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <span className="sr-only">Search requests</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests..."
              />
            </label>
          </div>
          {visibleRequests.length > 0 ? (
            <RequestList
              requests={visibleRequests}
              footer={
                <div className={styles.listFooter}>
                  <span className={styles.showing}>{showingLabel}</span>
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
              }
            />
          ) : (
            <div className={styles.noResults} role="status">
              No requests match your search or filter.
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
