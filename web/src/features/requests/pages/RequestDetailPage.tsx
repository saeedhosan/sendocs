import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { Badge, Button, ProgressBar } from '../../../components/ui'
import { ErrorState, LoadingState } from '../../../components/feedback'
import {
  ArrowBackIcon,
  LinkOffIcon,
  TrashIcon,
} from '../../../components/icons'
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
import styles from './RequestDetailPage.module.css'

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
  const { logout } = useAuth()
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
          if (error instanceof ApiError && error.status === 404) {
            setStatus('notfound')
            return
          }

          if (error instanceof ApiError && error.status === 401) {
            void logout().then(() => navigate('/login', { replace: true }))
            return
          }

          setStatus('error')
        })
    },
    [logout, navigate],
  )

  useEffect(() => {
    void load(id)
  }, [id, load])

  async function run(action: () => Promise<void>) {
    setBusy(true)

    try {
      await action()
    } catch (error) {
      setNotice({ tone: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
      setConfirm(null)
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
      navigate('/dashboard', { replace: true })
    })
  }

  function confirmDeleteDocument(item: RequestItem) {
    void run(async () => {
      await requestsApi.removeDocument(id, item.id)
      await load(id)
      setNotice({ tone: 'ok', message: 'Document deleted' })
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
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.back}>
        <ArrowBackIcon size={14} />
        <span>Back to requests</span>
      </Link>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{request.title}</h1>
            <Badge
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
          </div>
          <p className={styles.expiry}>{expiresLabel(request.expiresAt)}</p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<LinkOffIcon size={16} />}
            onClick={() => setConfirm({ kind: 'revoke' })}
            disabled={linkState(request) !== 'active'}
          >
            Revoke link
          </Button>
          <Button
            variant="danger"
            size="sm"
            iconLeft={<TrashIcon size={16} />}
            onClick={() => setConfirm({ kind: 'delete-request' })}
          >
            Delete request
          </Button>
        </div>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>
            {progressLabel(request.uploaded, request.total)}
          </span>
          <span className={styles.percent}>
            {percent(request.uploaded, request.total)}%
          </span>
        </div>
        <ProgressBar
          value={percent(request.uploaded, request.total)}
          tone={request.status === 'complete' ? 'complete' : 'waiting'}
          label={progressLabel(request.uploaded, request.total)}
        />
      </div>

      <section className={styles.linkPanel}>
        <div>
          <p className={styles.linkTitle}>Client portal link</p>
          <p className={styles.linkMeta}>
            {linkState(request) === 'active'
              ? expiresLabel(request.expiresAt)
              : linkStateLabel(linkState(request))}
          </p>
        </div>
        <span className={styles.linkNote}>Shown once at creation</span>
      </section>

      <section className={styles.documents}>
        <h2 className={styles.sectionTitle}>Requested Documents</h2>
        <ItemList
          items={request.items}
          onDeleteDocument={(item) =>
            setConfirm({ kind: 'delete-document', item })
          }
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
              ? `This permanently removes the request and all ${request.uploaded} uploaded document${request.uploaded === 1 ? '' : 's'}. This action cannot be undone.`
              : confirm?.kind === 'delete-document'
                ? `Permanently delete “${confirm.item.document?.originalName ?? confirm.item.label}”? This action cannot be undone.`
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
