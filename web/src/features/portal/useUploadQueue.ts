import { useCallback, useEffect, useReducer, useRef } from 'react'
import { ApiError } from '../../lib/api/client'
import { portalApi } from './api'
import { message as errorText, retryable as isRetryable } from './errors'
import { precheck } from './precheck'
import type { PortalView } from './types'

/** At most two transfers run at once; the rest wait in a visible queue. */
export const MAX_CONCURRENT_UPLOADS = 2

export type ItemFailure = {
  code: string
  message: string
  retryable: boolean
}

type QueueState = {
  /** itemId -> percent while a transfer is in flight. */
  transfers: Record<string, number>
  /** itemId -> failure for the last attempt, cleared on the next success. */
  failures: Record<string, ItemFailure>
  /** itemIds accepted but waiting for a free transfer slot. */
  queued: string[]
}

type QueueAction =
  | { type: 'enqueue'; itemId: string }
  | { type: 'start'; itemId: string }
  | { type: 'progress'; itemId: string; percent: number }
  | { type: 'settle'; itemId: string }
  | { type: 'fail'; itemId: string; failure: ItemFailure }
  | { type: 'cancel-all' }

const initialState: QueueState = { transfers: {}, failures: {}, queued: [] }

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) {
    return record
  }

  const next = { ...record }
  delete next[key]

  return next
}

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'enqueue':
      return {
        transfers: state.transfers,
        failures: omit(state.failures, action.itemId),
        queued: [...state.queued, action.itemId],
      }
    case 'start':
      return {
        transfers: { ...state.transfers, [action.itemId]: 0 },
        failures: omit(state.failures, action.itemId),
        queued: state.queued.filter((id) => id !== action.itemId),
      }
    case 'progress':
      return {
        ...state,
        transfers: { ...state.transfers, [action.itemId]: action.percent },
      }
    case 'settle':
      return {
        transfers: omit(state.transfers, action.itemId),
        failures: omit(state.failures, action.itemId),
        queued: state.queued,
      }
    case 'fail':
      return {
        transfers: omit(state.transfers, action.itemId),
        failures: { ...state.failures, [action.itemId]: action.failure },
        queued: state.queued,
      }
    case 'cancel-all':
      return initialState
    default:
      return state
  }
}

export type UploadQueue = {
  /** itemId -> percent while a transfer is in flight. */
  transfers: Record<string, number>
  /** itemId -> failure for the last attempt, cleared on the next success. */
  failures: Record<string, ItemFailure>
  /** itemIds accepted but waiting for a free transfer slot. */
  queued: string[]
  /** Validate locally, then queue a file for one item. */
  enqueue: (itemId: string, file: File) => void
  /** Abort every in-flight transfer and empty the queue. */
  cancelAll: () => void
}

type UseUploadQueueOptions = {
  token: string
  onUploaded: (view: PortalView) => void
  onDuplicate: () => void
  onDeadLink: () => void
}

/**
 * Owns per-item transfer state for the portal.
 *
 * It caps concurrency at two, keeps a visible queue for the rest, and treats a
 * `409 duplicate_upload` as success so a stale tab converges. A `410` aborts
 * everything and hands control to the dead-link screen.
 */
export function useUploadQueue({
  token,
  onUploaded,
  onDuplicate,
  onDeadLink,
}: UseUploadQueueOptions): UploadQueue {
  const [state, dispatch] = useReducer(queueReducer, initialState)

  const queueRef = useRef<Array<{ itemId: string; file: File }>>([])
  const activeRef = useRef(0)
  const controllersRef = useRef(new Map<string, AbortController>())
  const callbacksRef = useRef({ token, onUploaded, onDuplicate, onDeadLink })

  useEffect(() => {
    callbacksRef.current = { token, onUploaded, onDuplicate, onDeadLink }
  }, [token, onUploaded, onDuplicate, onDeadLink])

  const pumpRef = useRef<() => void>(() => {})

  const abortAll = useCallback(() => {
    queueRef.current = []
    activeRef.current = 0

    for (const controller of controllersRef.current.values()) {
      controller.abort()
    }

    controllersRef.current.clear()
  }, [])

  const runJob = useCallback(
    async (itemId: string, file: File) => {
      const controller = new AbortController()
      controllersRef.current.set(itemId, controller)

      try {
        const view = await portalApi.upload(
          callbacksRef.current.token,
          itemId,
          file,
          {
            signal: controller.signal,
            onProgress: (percent) =>
              dispatch({ type: 'progress', itemId, percent }),
          },
        )

        dispatch({ type: 'settle', itemId })
        callbacksRef.current.onUploaded(view)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        if (error instanceof ApiError && error.code === 'invalid_link') {
          abortAll()
          callbacksRef.current.onDeadLink()
          return
        }

        if (error instanceof ApiError && error.code === 'duplicate_upload') {
          dispatch({ type: 'settle', itemId })
          callbacksRef.current.onDuplicate()
          return
        }

        const code = error instanceof ApiError ? error.code : 'internal_error'

        dispatch({
          type: 'fail',
          itemId,
          failure: { code, message: errorText(code), retryable: isRetryable(code) },
        })
      } finally {
        controllersRef.current.delete(itemId)
        activeRef.current = Math.max(0, activeRef.current - 1)
        pumpRef.current()
      }
    },
    [abortAll],
  )

  const pump = useCallback(() => {
    while (
      activeRef.current < MAX_CONCURRENT_UPLOADS &&
      queueRef.current.length > 0
    ) {
      const job = queueRef.current.shift()

      if (!job) {
        break
      }

      activeRef.current += 1
      dispatch({ type: 'start', itemId: job.itemId })
      void runJob(job.itemId, job.file)
    }
  }, [runJob])

  useEffect(() => {
    pumpRef.current = pump
  }, [pump])

  useEffect(() => () => abortAll(), [abortAll])

  const enqueue = useCallback(
    (itemId: string, file: File) => {
      const result = precheck(file)

      if (!result.ok) {
        dispatch({
          type: 'fail',
          itemId,
          failure: {
            code: result.code,
            message: errorText(result.code),
            retryable: isRetryable(result.code),
          },
        })
        return
      }

      dispatch({ type: 'enqueue', itemId })
      queueRef.current.push({ itemId, file })
      pumpRef.current()
    },
    [],
  )

  const cancelAll = useCallback(() => {
    abortAll()
    dispatch({ type: 'cancel-all' })
  }, [abortAll])

  return {
    transfers: state.transfers,
    failures: state.failures,
    queued: state.queued,
    enqueue,
    cancelAll,
  }
}
