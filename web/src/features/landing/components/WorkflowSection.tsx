const steps = [
  {
    step: '01 — Create a request',
    title: 'Choose a title and list the required documents',
    body: 'Specify the items you need and provide clear instructions for each file.',
  },
  {
    step: '02 — Share the link',
    title: 'Send your client a secure link',
    body: 'Clients open the portal and submit documents without creating an account.',
  },
  {
    step: '03 — Collect documents',
    title: 'Track uploads and download the files',
    body: 'Monitor progress in real time and download received files securely.',
  },
]

export function WorkflowSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 max-w-[36rem]">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.625rem]">
          How it works
        </h2>
        <p className="text-sm leading-[1.625] text-marketing-text-secondary">
          A straightforward workflow designed for independent professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((item) => (
          <article
            key={item.step}
            className="flex flex-col gap-3 p-5 bg-surface border border-border rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <p className="font-mono text-xs font-medium tracking-[0.05em] uppercase text-ink-muted">
              {item.step}
            </p>
            <h3 className="text-[0.9375rem] font-semibold text-ink">
              {item.title}
            </h3>
            <p className="text-[0.8125rem] leading-[1.625] text-marketing-text-secondary">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
