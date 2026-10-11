import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Container } from '../../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DescriptionIcon,
  PlusIcon,
} from '../../../components/icons'
import { ApiError } from '../../../lib/api/client'
import { RequestFilters } from '../components/RequestFilters'
import type { RequestFilter } from '../components/RequestFilters'
import { RequestList } from '../components/RequestList'
import { Notice } from '../components/Notice'
import { requestsApi } from '../api'
import type { RequestSummary } from '../types'

export function RequestsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const cursor = searchParams.get('cursor')

  const [requests, setRequests] = useStateCRequestSummary[]>([])
  const [pageCursor, setPageCursor] = useStateCstring | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [canGoPrevious, setCanGoPrevious] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [filter, setFilter] = useState<RequestFilter>('all')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(
    () => (location.state as { notice?: string } | null)?.notice ?? null,
  )
  const historyRef = useRef<Array<string | null>>([])
  const cursorRef = useRef<string | null>(cursor)

  useEffect(() => {
    if ((location.state as { notice?: string } | null)?.notice) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      })
    }
  }, [location, navigate])

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
    setPageNumber((current) => current + 1)
    setStatus('loading')
    setCursor(pageCursor)
  }

  function goPrevious() {
    if (historyRef.current.length === 0) {
      return
    }

    const previous = historyRef.current.pop() ?? null
    setCanGoPrevious(historyRef.current.length > 0)
    setPageNumber((current) => Math.max(1, current - 1))
    setStatus('loading')
    setCursor(previous)
  }

  const trimmedQuery = query.trim().toLowerCase()
  const visible = requests.filter((request) => {
    const matchesStatus = filter === 'all' || request.status === filter
    const matchesQuery =
      trimmedQuery === '' || request.title.toLowerCase().includes(trimmedQuery)

    return matchesStatus && matchesQuery
  })

  const counts: Record<RequestFilter, number> = {
    all: requests.length,
    waiting: requests.filter((request) => request.status === 'waiting').length,
    complete: requests.filter((request) => request.status === 'complete')
      .length,
  }

  const pageLabel = pageCursor
    ? `${pageNumber} / ${pageNumber + 1}`
    : `${pageNumber} / ${pageNumber}`

  return (
    <Container className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl leading-7 font-semibold tracking-[-0.01em] text-ink sm:text-2xl sm:leading-8">
            Document Requests
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Collect and track client documentation
          </p>
        </div>
        <Button
          iconLeft={<PlusIcon size={18} />}
          className="w-full min-h-11 rounded-[10px] sm:w-auto sm:h-9 sm:min-h-9"
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
              className="rounded-[10px]"
              onClick={() => navigate('/requests/new')}
            >
              Create request
            </Button>
          }
        />
      ) : null}

      {requests.length > 0 ? (
        <>
          <RequestFilters
            value={filter}
            onChange={setFilter}
            query={query}
            onQueryChange={setQuery}
            counts={counts}
          />
          <RequestList
            requests={visible}
            empty={<p>No requests match your search.</p>}
            footer={
              <div className="flex flex-col gap-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
                  <span className="font-medium text-ink-secondary">
                    Showing 1 to {visible.length} of {requests.length} request
                    {requests.length === 1 ? '' : 's'}
                  </span>
                  <span className="hidden items-center gap-1 font-mono text-[0.6875rem] text-success-text sm:inline-flex">
                    <span
                      className="size-1.5 rounded-full bg-success"
                      aria-hidden="true"
                    />
                    All synced
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<ChevronLeftIcon size={16} />}
                    onClick={goPrevious}
                    disabled={!canGoPrevious}
                  >
                    Previous
                  </Button>
                  <span className="px-2 font-mono text-[0.6875rem] text-ink-secondary">
                    {pageLabel}
                  </span>
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
        </>
      ) : null}

      {notice ? (
        <Notice
          tone="ok"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
    </Container>
  )
}
