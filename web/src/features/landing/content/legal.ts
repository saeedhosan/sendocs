/**
 * Structured legal-page content.
 *
 * The copy is transcribed verbatim from the committed design references
 * (ui/landing/privacy_policy and ui/landing/terms_of_service). It is data, not
 * markup, so the same renderer can lay out either document.
 */
export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: LegalListItem[] }

export type LegalListItem = {
  /** The bolded lead-in shown before the colon, e.g. "Account Identity Data". */
  lead: string
  text: string
}

export type LegalSection = {
  heading: string
  blocks: LegalBlock[]
}

export type LegalDocumentContent = {
  title: string
  updated: string
  /** An optional opening paragraph shown before the first section. */
  intro?: string
  sections: LegalSection[]
  /** An optional closing note, separated by a rule, with a linked contact email. */
  note?: {
    text: string
    email: string
  }
}
