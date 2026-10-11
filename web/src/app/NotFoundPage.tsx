import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import { Button, Container } from '../components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Container className="flex flex-col items-center justify-center min-h-screen py-6 text-center">
      <Logo />
      <p className="font-mono text-sm tracking-[0.1em] uppercase text-primary">
        Error 404
      </p>
      <h1 className="mt-3 mb-2 text-2xl font-semibold tracking-[-0.025em] text-ink">
        Page not found
      </h1>
      <p className="max-w-sm mb-6 text-sm text-ink-muted">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-2.5">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </div>
    </Container>
  )
}
