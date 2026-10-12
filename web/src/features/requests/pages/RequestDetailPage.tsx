import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, PageHeader, ProgressBar } from '../../../components/ui'
import { ErrorState, LoadingState } from '../../../components/feedback'
import { LinkOffIcon, TrashIcon } from '../../../components/icons'
import { ApiError } from '../../../lib/api/client'
import { errorMessage } from '../../../lib/api/errors'
import { formatDate } from '../../../lib/format'
import {
  linkState,
  linkStateLabel,
  percent,
  progressLabel,
} from '../progress'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ItemList } from '../components/ItemList'
import { Notice } from '../components/Notice'
import type { NoticeTone } from '../components/Notice'
import { requestsApi } from '../api'
import type { RequestDetail, RequestItem } from '../types'

type ConfirmState =
  | { kind: 'revoke' }
  | { kind: 'delete-request' }
  | { kind: 'delete-document'; item: RequestItem }
  | null

type NoticeState = { tone: NoticeTone; message: string } | null

function expiresLabel(iso: string, now: number = Date.now()): string {
  const days = Math.ceil((new Date(iso).getTime() - now) / 86_400_000)

  if (days <= 0) {
    return `Expired ${formatDate(iso)}`
  }

  return `Expires in ${days} day${days === 1 ? '' : 's'} (${formatDate(iso)})`
}

export function RequestDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'notfound'>(
    'loading',
  )
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const load = useCallback(
    (requestId: string) => {
      return requestsApi
        .get(requestId)
        .then((data) => {
          setRequest(data)
          setStatus('ready')
        })
        .catch((error) => {
          // A rejected session is handled centrally: the shell clears it and
          // the route guard returns to sign-in.
          if (error instanceof ApiError && error.code === 'unauthenticated') {
            return
          }

          if (error instanceof ApiError && error.status === 404) {
            setStatus('notfound')
            return
          }

          setStatus('error')
        })
    },
    [],
  )

  useEffect(() => {
    void load(id)
  }, [id, load])

  async function run(action: () => Promise<void>) {
    setBusy(true)

    try {
      await action()
      // The dialog closes only once the action succeeds; failures surface the
      // error and keep the confirmation open to retry.
      setConfirm(null)
    } catch (error) {
      setNotice({ tone: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  function confirmRevoke() {
    void run(async () => {
      const updated = await requestsApi.revoke(id)
      setRequest(updated)
      setNotice({ tone: 'ok', message: 'Magic link revoked' })
    })
  }

  function confirmDeleteRequest() {
    void run(async () => {
      await requestsApi.remove(id)
      navigate('/dashboard', {
        replace: true,
        state: { notice: 'Request deleted' },
      })
    })
  }

  function confirmDeleteDocument(item: RequestItem) {
    void run(async () => {
      await requestsApi.removeDocument(id, item.id)
      await load(id)
      setNotice({
        tone: 'ok',
        message: `Deleted ${item.document?.originalName ?? item.label}`,
      })
    })
  }

  function downloadDocument(item: RequestItem) {
    setNotice({
      tone: 'ok',
      message: `Downloading ${item.document?.originalName ?? item.label}`,
    })
  }

  if (status === 'loading') {
    return <LoadingState title="Loading request" />
  }

  if (status === 'notfound') {
    return (
      <ErrorState
        title="Request not found"
        message="This request does not exist or is no longer available."
        action={
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Back to requests
          </Button>
        }
      />
    )
  }

  if (status === 'error' || request === null) {
    return (
      <ErrorState
        message="We could not load this request."
        action={
          <Button variant="secondary" onClick={() => void load(id)}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ to: '/dashboard', label: 'Back to requests' }}
        title={request.title}
        badge={
          <Badge
            className="rounded-[10px]"
            variant={
              linkState(request) === 'active'
                ? 'success'
                : linkState(request) === 'revoked'
                  ? 'danger'
                  : 'warning'
            }
          >
            {linkStateLabel(linkState(request))}
          </Badge>
        }
        subtitle={expiresLabel(request.expiresAt)}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<LinkOffIcon size={16} />}
              className="rounded-[10px]"
              onClick={() => setConfirm({ kind: 'revoke' })}
              disabled={linkState(request) !== 'active'}
            >
              Revoke link
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<TrashIcon size={16} />}
              className="rounded-[10px]"
              onClick={() => setConfirm({ kind: 'delete-request' })}
            >
              Delete request
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-800">
            {progressLabel(request.uploaded, request.total)}
          </span>
          <span className="font-mono text-ink-muted">
            {percent(request.uploaded, request.total)}%
          </span>
        </div>
        <ProgressBar
          value={percent(request.uploaded, request.total)}
          tone="waiting"
          className="rounded-[10px] [&>span]:bg-[#304fcf]"
          label={progressLabel(request.uploaded, request.total)}
        />
      </div>

      <section className="flex flex-col gap-3 my-2 p-4 border border-border rounded-[10px] bg-surface sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-ink">Client portal link</p>
          <p className="mt-1.5 text-xs text-ink-muted">
            {linkState(request) === 'active'
              ? expiresLabel(request.expiresAt)
              : linkStateLabel(linkState(request))}
          </p>
        </div>
        <span className="text-xs text-ink-muted">Shown once at creation</span>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase text-ink-muted">
          Requested Documents
        </h2>
        <ItemList
          items={request.items}
          onDeleteDocument={(item) =>
            setConfirm({ kind: 'delete-document', item })
          }
          onDownloadDocument={downloadDocument}
        />
      </section>

      <ConfirmDialog
        open={confirm !== null}
        busy={busy}
        tone={confirm?.kind === 'revoke' ? 'default' : 'danger'}
        title={
          confirm?.kind === 'revoke'
            ? 'Revoke client link?'
            : confirm?.kind === 'delete-request'
              ? 'Delete this request?'
              : 'Delete document?'
        }
        description={
          confirm?.kind === 'revoke'
            ? 'Are you sure you want to revoke this link? The client will immediately lose access. This action cannot be undone.'
            : confirm?.kind === 'delete-request'
              ? `Are you sure you want to delete this request? This permanently removes the request and all ${request.uploaded} uploaded document${request.uploaded === 1 ? '' : 's'}. This action cannot be undone.`
            : confirm?.kind === 'delete-document'
              ? `Are you sure you want to permanently delete "${confirm.item.document?.originalName ?? confirm.item.label}"?`
              : ''
        }
        confirmLabel={
          confirm?.kind === 'revoke'
            ? 'Revoke link'
            : confirm?.kind === 'delete-request'
              ? 'Delete request'
              : 'Delete'
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.kind === 'revoke') {
            confirmRevoke()
          } else if (confirm?.kind === 'delete-request') {
            confirmDeleteRequest()
          } else if (confirm?.kind === 'delete-document') {
            confirmDeleteDocument(confirm.item)
          }
        }}
      />

      {notice ? (
        <Notice
          tone={notice.tone}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      ) : null}
    </div>
  )
}
