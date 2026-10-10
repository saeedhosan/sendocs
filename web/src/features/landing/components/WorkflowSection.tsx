import styles from './WorkflowSection.module.css'

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
    <section className={styles.section}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>How it works</h2>
        <p className={styles.subheading}>
          A straightforward workflow designed for independent professionals.
        </p>
      </div>

      <div className={styles.grid}>
        {steps.map((item) => (
          <article key={item.step} className={styles.card}>
            <p className={styles.step}>{item.step}</p>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.body}>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
