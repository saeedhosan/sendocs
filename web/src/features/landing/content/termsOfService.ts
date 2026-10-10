import type { LegalDocumentContent } from './legal'

export const termsOfService: LegalDocumentContent = {
  title: 'Terms of Service',
  updated: 'January 15, 2026',
  intro: 'This Master Regulatory Framework outlines the mandatory obligations, mutual covenants, cryptographic protocols, and ingestion rules governing the usage of Sendocs confidential document transmission infrastructure.',
  sections: [
    {
      heading: '1. Scope of Service & Magic Links',
      blocks: [
        { type: 'paragraph', text: 'Sendocs Technologies Inc. ("Sendocs", "we", or "the Platform") provides an asynchronous, zero-knowledge verifiable transmission system engineered for institutional professionals including registered public accountants, legal counsel, trust executives, and corporate treasuries.' },
        { type: 'paragraph', text: 'Access to transactional ingestion containers is provisioned primarily through time-gated, cryptographic Magic Links. A Magic Link acts as a single-use bearer token incorporating short-lived cryptographic assertions signed by our global authorization authority. By deploying, delivering, or accessing a Sendocs Magic Link, you confirm acceptance of this automated agreement.' },
      ],
    },
    {
      heading: '2. User Accounts & Authorized Representatives',
      blocks: [
        { type: 'paragraph', text: 'Administrative organizations ("Tenants") represent that any person designated as an Account Administrator possesses actual legal authority to bind the institutional entity. Sub-tenant access rights must follow least-privilege role boundaries.' },
        { type: 'paragraph', text: 'Tenants assume full liability for all payloads received via authorized channels, including compliance with international transfer treaties such as GDPR Chapter V, HIPAA Business Associate protocols, and SOC2 Trust Services Criteria.' },
      ],
    },
    {
      heading: '3. Document Ingestion Limits & Specifications',
      blocks: [
        { type: 'paragraph', text: 'To guarantee instant micro-sandboxing, zero-latency parsing, and deterministic heuristic malware analysis at the WAN edge, Sendocs executes immutable computational boundaries on every incoming payload. Raw file binaries exceeding exactly 25.0 megabytes (26,214,400 bytes) are rejected at the edge gateway via HTTP 413 (Payload Too Large). Multipart chunking cannot bypass individual file evaluation boundaries.' },
        { type: 'paragraph', text: 'Ingested file representations must strictly conform to allowed MIME signatures (PDF/A, PDF 1.4-2.0, TIFF, CSV, XML, DOCX, XLSX). Executable binaries (.exe, .bat, .dll), macro-enabled formats with embedded scripts, and obfuscated archives (.iso, .7z) are rejected by automated gateway filtering.' },
      ],
    },
    {
      heading: '4. Client Portal Terms & End-User Undertakings',
      blocks: [
        { type: 'paragraph', text: 'Third-party document submitters ("End-Users") using a client portal are provided with an encrypted ingestion viewport. End-Users warrant that uploaded documentation contains no malicious software, payload steganography, or unlawful material.' },
        { type: 'paragraph', text: 'Portals generate automated delivery confirmations. A delivery receipt provides mathematical proof that an encrypted blob matching a distinct cryptographic hash was committed into storage at a verified timestamp. It does not certify substantive accuracy, legal enforceability, or business validity of enclosed records.' },
      ],
    },
    {
      heading: '5. Confidentiality & Cryptographic Standards',
      blocks: [
        { type: 'paragraph', text: 'Sendocs acts strictly as a zero-knowledge confidential pipe. Payload encryption relies upon client-side derived envelope keys combined with asymmetric elliptic-curve key pairs (Ed25519 for signing, X25519 for key exchange, and AES-GCM-256 for symmetric chunk encryption).' },
        { type: 'paragraph', text: 'Because Sendocs does not hold escrow over Tenant private keys, Sendocs employees cannot decrypt, inspect, reconstitute, or provide cleartext records pursuant to subpoena or judicial discovery requests where keys remain exclusively in Tenant control.' },
      ],
    },
    {
      heading: '6. Revocation & Cryptographic File Shredding',
      blocks: [
        { type: 'paragraph', text: 'Sendocs provides instantaneous, owner-controlled revocation authority. A tenant administrator may issue an unrecoverable revocation request at any microsecond. Upon triggering, the specific AES master decryption key is purged from volatile HSM memory and overwritten using cryptographic pseudorandom noise. All associated URLs and pending magic links across global edge locations drop transmission routes within 600 milliseconds.' },
      ],
    },
    {
      heading: '7. Institutional Disclaimers & Limitation of Liability',
      blocks: [
        { type: 'paragraph', text: 'To the fullest extent permitted by applicable jurisprudential statutes, Sendocs Technologies Inc. expressly disclaims all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular transactional purpose, and non-infringement.' },
        { type: 'paragraph', text: 'Under no legal theory shall Sendocs aggregate liability exceed the total fees paid by the tenant in the twelve (12) calendar months preceding the occurrence of the event giving rise to liability. Sendocs disclaims direct liability for loss of tenant-managed private recovery passkeys.' },
      ],
    },
    {
      heading: '8. Contact, Legal Notices & Dispute Resolution',
      blocks: [
        { type: 'paragraph', text: 'All official notices under this agreement must be transmitted in digital, cryptographically signed format to legal@sendocs.io or via certified mail addressed to Sendocs Technologies Inc., Attention: General Counsel & Data Protection Officer, 548 Market Street, Suite 89201, San Francisco, CA 94104-5401.' },
        { type: 'paragraph', text: 'Disputes not resolved through informal good-faith executive negotiation within thirty (30) business days shall be settled exclusively via confidential binding arbitration administered by JAMS in San Francisco, California under its Comprehensive Arbitration Rules.' },
      ],
    },
  ],
}
