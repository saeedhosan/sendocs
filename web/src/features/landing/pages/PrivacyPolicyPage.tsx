import { LegalDocument } from '../components/LegalDocument'
import { privacyPolicy } from '../content/privacyPolicy'

export function PrivacyPolicyPage() {
  return <LegalDocument document={privacyPolicy} />
}
