import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DescriptionIcon,
  PlusIcon,
} from '../../../components/icons'
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { ApiError } from '../../../lib/api/client'
import { requestsApi } from '../api'
import { Notice } from '../components/Notice'
import type { RequestFilter } from '../components/RequestFilters'
import { RequestFilters } from '../components/RequestFilters'
import { RequestList } from '../components/RequestList'
import type { RequestSummary } from '../types'

export function RequestsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const cursor = searchParams.get('cursor')

  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [pageCursor, setPageCursor] = useState<string | null>(null)
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
    <div className="flex flex-col mb-20">
      <PageHeader
        title="Document Requests"
        subtitle="Collect and track client documentation"
        actions={
          <Button
            className="rounded-[10px]"
            onClick={() => navigate('/requests/new')}
          >
            <PlusIcon data-icon="inline-start" size={18} />
            New request
          </Button>
        }
      />

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
              className="rounded-[10px]"
              onClick={() => navigate('/requests/new')}
            >
              <PlusIcon data-icon="inline-start" size={18} />
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
                    className="sm:h-auto sm:min-h-0 sm:py-1.5"
                    onClick={goPrevious}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeftIcon data-icon="inline-start" size={16} />
                    Previous
                  </Button>
                  <span className="px-2 font-mono text-[0.6875rem] text-ink-secondary">
                    {pageLabel}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="sm:h-auto sm:min-h-0 sm:py-1.5"
                    onClick={goNext}
                    disabled={!pageCursor}
                  >
                    Next
                    <ChevronRightIcon data-icon="inline-end" size={16} />
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
    </div>
  )
}
