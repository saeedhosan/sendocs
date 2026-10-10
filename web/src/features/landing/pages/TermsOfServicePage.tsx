import { LegalDocument } from '../components/LegalDocument'
import { termsOfService } from '../content/termsOfService'

export function TermsOfServicePage() {
  return <LegalDocument document={termsOfService} />
}
