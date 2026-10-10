import type { LegalDocumentContent } from './legal'

export const privacyPolicy: LegalDocumentContent = {
  title: 'Privacy Policy',
  updated: 'January 15, 2026',
  sections: [
    {
      heading: '1. Zero-Knowledge Invariant',
      blocks: [
        { type: 'paragraph', text: 'Sendocs operates under an architectural zero-knowledge invariant. Document payloads collected through our request pipelines are processed as opaque cryptographic envelopes. Our administrative tooling, internal support engineers, and automated worker engines have zero plaintext visibility into customer files.' },
        { type: 'paragraph', text: 'Every document collection capsule generates an isolated AES-256-GCM envelope key at request generation. Keys are decrypted solely within the client browser runtime or within hardware-isolated enclave instances for validation parsing when configured explicitly by institutional auditors.' },
      ],
    },
    {
      heading: '2. Information We Collect (Minimal Scope)',
      blocks: [
        { type: 'paragraph', text: 'We adhere to an austere data collection model. We solicit only what is mathematically strictly necessary to authenticate requestors, route transactional magic links, and maintain legal tamper-evident logs for regulated professionals.' },
        {
          type: 'list',
          items: [
            {
              lead: 'Account Identity Data:',
              text: 'Institutional subscriber work email, professional firm legal name, and Stripe transaction references. We do not store raw payment card data on Sendocs infrastructure.',
            },
            {
              lead: 'Audit Envelope Metadata:',
              text: 'SHA-256 payload digests, upload timestamps (UTC), file size byte totals, and recipient acknowledgment states required for compliance audit logs.',
            },
            {
              lead: 'Document Content:',
              text: 'Federal tax filings, bank ledgers, identification scans, and proprietary agreements remain end-to-end encrypted; our platform engine cannot parse this data.',
            },
            {
              lead: 'Behavioral & Ad Tracking:',
              text: 'Strictly null. Cross-site trackers, advertising identifiers, canvas fingerprints, and browsing behavioral analytics are categorically absent across all surfaces.',
            },
          ],
        },
      ],
    },
    {
      heading: '3. Storage Architecture Topology',
      blocks: [
        { type: 'paragraph', text: 'Our storage topology enforces strict temporal and physical isolation. Payload bytes never persist in intermediary reverse proxies or application node file systems. Chunks are held exclusively in volatile RAM and immediately dispatched to enterprise Amazon S3 private storage using client-designated geo-fencing (US-East or EU-Central). Once committed, RAM blocks are zeroized.' },
      ],
    },
    {
      heading: '4. Magic Link Security',
      blocks: [
        { type: 'paragraph', text: 'Authentication uses cryptographically signed Magic Links designed to prevent unauthorized relay or credential harvesting:' },
        {
          type: 'list',
          items: [
            {
              lead: 'Strict 15-Minute Expiry:',
              text: 'Magic link tokens expire automatically 15 minutes post-generation or immediately after first redemption.',
            },
            {
              lead: 'Single-Use Nonce Hash:',
              text: 'Every link carries a high-entropy SHA-512 cryptographic nonce invalidated in distributed Redis cache upon initial request consumption.',
            },
            {
              lead: 'IP Binding & Rate Throttling:',
              text: 'Token requests are dynamically throttled per tenant to safeguard against automated enumeration attempts.',
            },
          ],
        },
      ],
    },
    {
      heading: '5. Retention & Deletion Schedules',
      blocks: [
        { type: 'paragraph', text: 'We enforce deterministic data lifecycles. Institutional account holders retain granular control over default expiration policies for collected documents. Standard request capsules purge after 30 days by default, while compliance archive configurations allow customer-specified retentions from 1 to 7 years. Ephemeral ingestion caches in RAM persist for less than 60 seconds.' },
      ],
    },
    {
      heading: '6. Zero Third-Party Telemetry Policy',
      blocks: [
        { type: 'paragraph', text: 'Sendocs explicitly guarantees that no third-party user behavioral trackers, advertising beacons, or session recording suites (e.g., Hotjar, FullStory, Google Analytics, Segment, Meta Pixel) are loaded within our application. Our Content Security Policy strictly blocks execution of any external script host not explicitly listed in our subprocessor schedule.' },
      ],
    },
    {
      heading: '7. Subprocessors',
      blocks: [
        { type: 'paragraph', text: 'Sendocs works exclusively with verified Tier-1 infrastructure vendors who adhere to SOC 2 Type II, ISO 27001, and HIPAA compliance protocols:' },
        {
          type: 'list',
          items: [
            {
              lead: 'Amazon Web Services (AWS):',
              text: 'Encrypted storage & core compute pods (US-East / EU-Central).',
            },
            {
              lead: 'Cloudflare, Inc.:',
              text: 'DDoS mitigation & edge network.',
            },
            {
              lead: 'Postmark (ActiveCampaign):',
              text: 'Transactional email delivery only with zero content logging.',
            },
          ],
        },
      ],
    },
    {
      heading: '8. Permanent Self-Service Erasure',
      blocks: [
        { type: 'paragraph', text: 'In accordance with GDPR Article 17 and CCPA statutory requirements, institutional organization administrators retain the unconditional legal right to initiate immediate self-service account termination and cryptographic erasure. Execution permanently destroys AWS KMS customer master keys, purging all historical data partitions irrevocably.' },
      ],
    },
  ],
  note: {
    text: 'Have legal or compliance questions? Contact our dedicated compliance team at privacy@sendocs.internal.',
    email: 'privacy@sendocs.internal',
  },
}
