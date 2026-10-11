import { Container } from '../../../components/ui'
import type { LegalDocumentContent } from '../content/legal'
import styles from './LegalDocument.module.css'

function Note({ text, email }: { text: string; email: string }) {
  const [before, after] = text.split(email)

  return (
    <p className={styles.note}>
      {before}
      <a href={`mailto:${email}`} className={styles.noteLink}>
        {email}
      </a>
      {after}
    </p>
  )
}

/** Renders a transcribed legal document: title, sections, and an optional note. */
export function LegalDocument({ document }: { document: LegalDocumentContent }) {
  return (
    <Container as="article" className={styles.document}>
      <h1 className={styles.title}>{document.title}</h1>
      <p className={styles.updated}>Last updated: {document.updated}</p>

      {document.intro ? (
        <p className={styles.paragraph}>{document.intro}</p>
      ) : null}

      {document.sections.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h2 className={styles.heading}>{section.heading}</h2>

          {section.blocks.map((block, index) =>
            block.type === 'paragraph' ? (
              <p key={index} className={styles.paragraph}>
                {block.text}
              </p>
            ) : (
              <ul key={index} className={styles.list}>
                {block.items.map((item) => (
                  <li key={item.lead} className={styles.listItem}>
                    {item.lead ? (
                      <>
                        <strong className={styles.lead}>{item.lead}</strong>{' '}
                        {item.text}
                      </>
                    ) : (
                      item.text
                    )}
                  </li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}

      {document.note ? (
        <div className={styles.noteWrap}>
          <Note {...document.note} />
        </div>
      ) : null}
    </Container>
  )
}
