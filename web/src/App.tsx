import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { api, clearSession, getSession, login, logout, register, type ApiError, type CreatedRequest, type RequestPage, type RequestSummary, type Session } from './api'
import './App.css'

type Screen = 'login' | 'register' | 'dashboard' | 'create'
function route(): Screen {
  if (location.pathname === '/register') return 'register'
  if (location.pathname === '/requests/new') return 'create'
  if (location.pathname === '/dashboard') return 'dashboard'
  return 'login'
}
function go(path: string): void { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')) }
function message(error: unknown): string {
  const e = error as ApiError
  if (e.status === 422 && e.details) {
    const first = Object.values(e.details).flatMap((v) => Array.isArray(v) ? v : [v])[0]
    if (typeof first === 'string') return first
  }
  if (e.status === 429) return 'Too many attempts. Try again in ' + (e.retryAfter ?? 60) + ' seconds.'
  return e.message || 'Something went wrong. Please try again.'
}
function date(value: string | null): string {
  if (!value) return 'No uploads yet'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function App() {
  const [page, setPage] = useState<Screen>(route)
  const [session, setSession] = useState<Session | null>(null)
  const [boot, setBoot] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [rows, setRows] = useState<RequestSummary[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<CreatedRequest['link'] | null>(null)

  const load = useCallback(async (next?: string) => {
    setBusy(true); setError('')
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (next) params.set('cursor', next)
      const result = await api<RequestPage>('/api/v1/requests?' + params.toString())
      setRows((current) => next ? [...current, ...result.data] : result.data)
      setCursor(result.nextCursor)
    } catch (e) {
      if ((e as ApiError).status === 401) { clearSession(); setSession(null); go('/login') }
      else setError(message(e))
    } finally { setBusy(false) }
  }, [])

  useEffect(() => {
    const pop = () => { setPage(route()); setError(''); setNotice(''); setRevealed(null) }
    addEventListener('popstate', pop)
    void getSession().then(setSession).catch(() => { clearSession(); setSession(null) }).finally(() => setBoot(false))
    return () => removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    if (boot) return
    if (!session && page !== 'login' && page !== 'register') go('/login')
    if (session && (page === 'login' || page === 'register')) go('/dashboard')
  }, [boot, page, session])
  useEffect(() => { if (session && !boot && page === 'dashboard') void Promise.resolve().then(() => load()) }, [session, boot, page, load])

  async function auth(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setError('')
    const data = new FormData(event.currentTarget)
    try {
      const value = page === 'register'
        ? await register(String(data.get('name') ?? '').trim(), String(data.get('email') ?? '').trim(), String(data.get('password') ?? ''))
        : await login(String(data.get('email') ?? '').trim(), String(data.get('password') ?? ''))
      setSession(value); setNotice('Welcome' + (page === 'register' ? ' to Sendocs.' : ' back.')); go('/dashboard')
    } catch (e) { setError(message(e)) } finally { setBusy(false) }
  }
  async function google(): Promise<void> {
    setBusy(true); setError('')
    try { const result = await api<{ authUrl: string }>('/api/v1/auth/oauth/google'); location.assign(result.authUrl) }
    catch (e) { setError(message(e)); setBusy(false) }
  }
  async function signOut(): Promise<void> {
    setBusy(true)
    try { await logout() } catch { /* Expired sessions still clear local state. */ }
    clearSession(); setSession(null); setRows([]); go('/login'); setBusy(false)
  }
  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    const items = Array.from(form.querySelectorAll<HTMLInputElement>('[name="item-label"]')).map((input) => ({ label: input.value.trim() }))
    try {
      const result = await api<CreatedRequest>('/api/v1/requests', { method: 'POST', body: JSON.stringify({ title: String(data.get('title') ?? '').trim(), items }) })
      setRevealed(result.link); setNotice('Request created. Copy the link and share it with your client.')
    } catch (e) { setError(message(e)) } finally { setBusy(false) }
  }

  if (boot) return <main className="boot-screen"><span className="brand-mark">s</span><p>Loading your workspace…</p></main>
  if (!session) return <main className="auth-layout">
    <section className="auth-story"><a className="brand" href="/login" onClick={(e) => { e.preventDefault(); go('/login') }}><span className="brand-mark">s</span> sendocs</a><div className="story-copy"><span className="eyebrow">LESS CHASING. MORE CLARITY.</span><h1>All the documents you need. <em>One simple link.</em></h1><p>Give your clients one secure place to send the files you need. No account required on their side.</p></div><div className="story-foot">Private by design <span>·</span> Made for real work</div></section>
    <section className="auth-panel"><div className="auth-card"><div className="mobile-brand"><span className="brand-mark">s</span> sendocs</div><span className="eyebrow">{page === 'register' ? 'GET STARTED' : 'WELCOME BACK'}</span><h2>{page === 'register' ? 'Create your account' : 'Sign in to Sendocs'}</h2><p className="muted">{page === 'register' ? 'Start collecting documents without the back-and-forth.' : 'Pick up where you left off.'}</p>
      {error && <Alert error>{error}</Alert>}<button className="button button-secondary full-width" onClick={() => void google()} disabled={busy}><GoogleIcon /> Continue with Google</button><div className="separator"><span>or continue with email</span></div>
      <form className="stack-form" onSubmit={(e) => void auth(e)}>{page === 'register' && <label>Full name<input name="name" autoComplete="name" required maxLength={120} placeholder="Your name" /> </label>}<label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label><label>Password<input name="password" type="password" autoComplete={page === 'register' ? 'new-password' : 'current-password'} required minLength={page === 'register' ? 12 : undefined} maxLength={200} placeholder={page === 'register' ? 'At least 12 characters' : 'Enter your password'} /></label><button className="button button-primary full-width" disabled={busy}>{busy ? 'Please wait…' : page === 'register' ? 'Create account →' : 'Sign in →'}</button></form>
      <p className="auth-switch">{page === 'register' ? 'Already have an account?' : 'New to Sendocs?'} <a href={page === 'register' ? '/login' : '/register'} onClick={(e) => { e.preventDefault(); setError(''); go(page === 'register' ? '/login' : '/register') }}>{page === 'register' ? 'Sign in' : 'Create an account'}</a></p><p className="legal-note">Keep client documents private and secure. Never share a client link publicly.</p></div></section>
  </main>

  return <div className="app-shell"><header className="topbar"><a className="brand" href="/dashboard" onClick={(e) => { e.preventDefault(); go('/dashboard') }}><span className="brand-mark">s</span> sendocs</a><nav className="top-nav"><a className={page === 'dashboard' ? 'active' : ''} href="/dashboard" onClick={(e) => { e.preventDefault(); go('/dashboard') }}>Requests</a></nav><div className="account-area"><span className="avatar">{session.user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}</span><span className="account-name">{session.user.name}</span><button className="text-button" onClick={() => void signOut()} disabled={busy}>Sign out</button></div></header>
    <main className="page-content">{notice && <Alert success onClose={() => setNotice('')}>{notice}</Alert>}{error && <Alert error onClose={() => setError('')}>{error}</Alert>}
      {page === 'dashboard' && <><div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Document requests</h1><p className="muted">Collect files from clients, without the back-and-forth.</p></div><button className="button button-primary" onClick={() => { setError(''); go('/requests/new') }}>＋ New request</button></div><div className="stats-row"><Stat label="Requests on this page" value={rows.length + (cursor ? '+' : '')} caption="Your latest collections" /><Stat label="Waiting on clients" value={rows.filter((r) => r.status === 'waiting' && !r.revokedAt).length} caption="Still collecting files" /><Stat label="Completed" value={rows.filter((r) => r.status === 'complete').length} caption="All files received" /></div>
        <section className="panel"><div className="panel-heading"><div><h2>Recent requests</h2><p className="muted">Your latest client document collections.</p></div><button className="text-button" onClick={() => void load()} disabled={busy}>↻ Refresh</button></div>
          {busy ? <div className="loading-state"><span className="spinner" /> Loading requests…</div> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon"><DocumentIcon /></div><h3>Start with your first request</h3><p>Create a checklist of documents and share one secure link with your client.</p><button className="button button-primary" onClick={() => go('/requests/new')}>Create a request →</button></div> : <div className="request-list">{rows.map((r) => <div className="request-row" key={r.id}><div className="request-icon"><DocumentIcon /></div><div className="request-main"><strong>{r.title}</strong><span>{r.uploaded} of {r.total} documents received</span></div><div className="request-progress"><div className="progress-track"><span style={{ width: Math.round(r.uploaded / r.total * 100) + '%' }} /></div><span>{Math.round(r.uploaded / r.total * 100)}%</span></div><div className="request-status"><span className={'status-pill ' + (r.revokedAt ? 'status-revoked' : r.status === 'complete' ? 'status-complete' : 'status-waiting')}><span />{r.revokedAt ? 'Revoked' : r.status === 'complete' ? 'Complete' : 'Waiting'}</span><small>{date(r.lastActivityAt ?? r.createdAt)}</small></div></div>)}{cursor && <div className="pagination"><button className="button button-secondary" disabled={busy} onClick={() => void load(cursor)}>Load more requests</button></div>}</div>}</section><p className="page-footnote">Files stay private. Clients can upload through their link without creating an account.</p></>}
      {page === 'create' && <section className="form-page"><button className="back-link" onClick={() => go('/dashboard')}>← Back to requests</button><span className="eyebrow">NEW COLLECTION</span><h1>Create a document request</h1><p className="muted form-intro">Tell your client what you need. We'll make one secure link for the whole checklist.</p><form className="panel create-form" onSubmit={(e) => void create(e)}><label>Request name<input name="title" required maxLength={200} placeholder="e.g. 2026 tax return" /></label><div><div className="form-section-heading"><div><h2>Documents to collect</h2><p className="muted">Add a clear label for each file.</p></div><span className="count-badge">1–10 items</span></div><ItemFields /></div><div className="form-actions"><button className="button button-secondary" type="button" onClick={() => go('/dashboard')}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Creating…' : 'Create request →'}</button></div></form></section>}
      {revealed && <div className="modal-backdrop"><section className="reveal-dialog" role="dialog" aria-modal="true" aria-labelledby="reveal-title"><button className="modal-close" aria-label="Close" onClick={() => { setRevealed(null); go('/dashboard'); void load() }}>×</button><div className="reveal-icon">✓</div><span className="eyebrow">REQUEST CREATED</span><h2 id="reveal-title">Your secure link is ready</h2><p className="muted">Copy this link and send it to your client. For security, it won't be shown again after closing this window.</p><div className="copy-field"><input aria-label="Client link" readOnly value={revealed.url} onFocus={(e) => e.currentTarget.select()} /><button className="button button-primary" onClick={() => { void navigator.clipboard.writeText(revealed.url).then(() => setNotice('Link copied to clipboard.')).catch(() => { setNotice('Clipboard unavailable. Select and copy the link above.'); document.querySelector<HTMLInputElement>('.copy-field input')?.select() }) }}>Copy link</button></div><p className="expiry-note">Expires {date(revealed.expiresAt)} · Anyone with this link can upload files.</p><button className="button button-secondary full-width" onClick={() => { setRevealed(null); go('/dashboard'); void load() }}>Done</button></section></div>}
    </main><footer className="app-footer"><span>© {new Date().getFullYear()} Sendocs</span><span>Private document collection, made simple.</span></footer></div>
}

function Alert({ children, error, success, onClose }: { children: ReactNode; error?: boolean; success?: boolean; onClose?: () => void }) {
  return <div className={'alert ' + (error ? 'alert-error' : success ? 'alert-success' : '')} role={error ? 'alert' : 'status'}>{children}{onClose && <button aria-label="Dismiss message" onClick={onClose}>×</button>}</div>
}
function Stat({ label, value, caption }: { label: string; value: string | number; caption: string }) {
  return <div className="stat-card"><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-caption">{caption}</span></div>
}
function ItemFields() {
  const [items, setItems] = useState([''])
  return <div className="dynamic-items">{items.map((item, i) => <div className="dynamic-item" key={i}><span className="item-number">{String(i + 1).padStart(2, '0')}</span><input name="item-label" value={item} onChange={(e) => setItems((current) => current.map((v, j) => j === i ? e.target.value : v))} required maxLength={200} aria-label={'Document ' + (i + 1) + ' label'} placeholder={i === 0 ? 'e.g. Government-issued ID' : 'e.g. Proof of address'} /><button className="icon-button" type="button" disabled={items.length === 1} aria-label={'Remove document ' + (i + 1)} onClick={() => setItems((current) => current.filter((_, j) => j !== i))}>×</button></div>)}<button className="add-item-button" type="button" disabled={items.length >= 10} onClick={() => setItems((current) => [...current, ''])}>＋ Add another document <span>{items.length}/10</span></button></div>
}
function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.95 2.94v2.45h3.16c1.85-1.7 2.9-4.2 2.9-7.26Z"/><path fill="#34A853" d="M12 21.6c2.64 0 4.86-.88 6.48-2.38l-3.16-2.45c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.48-4.03H3.25v2.53A9.6 9.6 0 0 0 12 21.6Z"/><path fill="#FBBC05" d="M6.52 13.68a5.77 5.77 0 0 1 0-3.36V7.79H3.25a9.6 9.6 0 0 0 0 8.42l3.27-2.53Z"/><path fill="#EA4335" d="M12 6.29c1.44 0 2.73.5 3.75 1.5l2.82-2.82A9.42 9.42 0 0 0 12 2.4a9.6 9.6 0 0 0-8.75 5.39l3.27 2.53c.77-2.31 2.93-4.03 5.48-4.03Z"/></svg>
}
function DocumentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
}
