import { Container } from '../../../components/ui'
import styles from './ContactPage.module.css'

const contactEmail = 'privacy@sendocs.internal'

/**
 * Minimal contact page. It surfaces the address the product already publishes
 * in its legal documents rather than inventing a support channel.
 */
export function ContactPage() {
  return (
    <Container as="section" className={styles.page}>
      <h1 className={styles.title}>Contact</h1>

      <p className={styles.lede}>
        Sendocs is a document collection service. If you have a question about
        your account, a document request, or how your data is handled, email us.
      </p>

      <a href={`mailto:${contactEmail}`} className={styles.email}>
        {contactEmail}
      </a>
    </Container>
  )
}
