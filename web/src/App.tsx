import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <a className="brand" href="/" aria-label="Sendocs home">
            <span className="brand__mark" aria-hidden="true">
              S
            </span>
            <span>Sendocs</span>
          </a>
          <span className="app-header__label">Client document collection</span>
        </div>
      </header>

      <main className="app-main">
        <section className="workspace-placeholder" aria-labelledby="workspace-title">
          <p className="workspace-placeholder__eyebrow">Workspace</p>
          <h1 id="workspace-title">The workspace is being prepared.</h1>
          <p>
            The shared frontend foundation is in place. Dashboard, account, and
            client portal screens will be implemented in focused steps against
            the documented API contract.
          </p>
        </section>
      </main>
    </div>
  )
}

export default App
