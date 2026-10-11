import { Container } from '../../../components/ui'
import type { LegalDocumentContent } from '../content/legal'

function Note({ text, email }: { text: string; email: string }) {
  const [before, after] = text.split(email)

  return (
    <p className="text-sm text-ink-body">
      {before}
      <a
        href={`mailto:${email}`}
        className="font-medium text-primary hover:underline"
      >
        {email}
      </a>
      {after}
    </p>
  )
}

/** Renders a transcribed legal document: title, sections, and an optional note. */
export function LegalDocument({ document }: { document: LegalDocumentContent }) {
  return (
    <Container
      as="article"
      className="!max-w-4xl px-6 py-10 bg-surface"
    >
      <h1 className="mb-2 text-[1.875rem] font-bold leading-9 tracking-[-0.025em] text-ink">
        {document.title}
      </h1>
      <p className="mb-8 pb-6 border-b border-border text-sm leading-5 text-ink-muted">
        Last updated: {document.updated}
      </p>

      {document.intro ? (
        <p className="mb-4 text-sm leading-[1.625] text-ink-body">
          {document.intro}
        </p>
      ) : null}

      {document.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mt-6 mb-2 text-lg leading-7 font-semibold text-ink">
            {section.heading}
          </h2>

          {section.blocks.map((block, index) =>
            block.type === 'paragraph' ? (
              <p
                key={index}
                className="mb-4 text-sm leading-[1.625] text-ink-body"
              >
                {block.text}
              </p>
            ) : (
              <ul
                key={index}
                className="flex flex-col gap-2 mb-4 pl-0 list-disc list-inside text-sm leading-[1.625] text-ink-body"
              >
                {block.items.map((item) => (
                  <li
                    key={item.lead}
                    className="text-sm leading-[1.625] text-ink-body"
                  >
                    {item.lead ? (
                      <>
                        <strong className="font-semibold text-ink-emphasis">
                          {item.lead}
                        </strong>{' '}
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
        <div className="mt-6 pt-6 border-t border-border">
          <Note {...document.note} />
        </div>
      ) : null}
    </Container>
  )
}
