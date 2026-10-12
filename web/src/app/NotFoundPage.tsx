import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import { Button } from '../components/ui'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-col items-center justify-center min-h-screen py-6 text-center">
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
    </div>
  )
}
