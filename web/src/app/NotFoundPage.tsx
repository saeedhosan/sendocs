import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import { Button } from '../components/ui'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <Logo />
      <p className={styles.code}>Error 404</p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.subtitle}>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </div>
    </div>
  )
}
