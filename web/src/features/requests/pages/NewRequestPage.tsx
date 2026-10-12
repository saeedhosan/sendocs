import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container } from '../../../components/ui'
import { NewRequestForm } from '../components/NewRequestForm'
import { LinkReveal } from '../components/LinkReveal'
import { requestsApi } from '../api'
import type { CreatedRequest, CreateRequestInput } from '../types'

export function NewRequestPage() {
  const navigate = useNavigate()
  const [created, setCreated] = useState<CreatedRequest | null>(null)

  async function handleCreate(input: CreateRequestInput) {
    const result = await requestsApi.create(input)
    setCreated(result)
  }

  function dismiss() {
    setCreated(null)
    navigate('/dashboard', { replace: true })
  }

  return (
    <Container className="!max-w-2xl px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
      <h1 className="text-xl leading-[1.5] font-semibold tracking-tight text-ink sm:text-[1.375rem]">
        New document request
      </h1>
      <NewRequestForm onSubmit={handleCreate} />
      <LinkReveal
        open={created !== null}
        link={created?.link ?? null}
        onClose={dismiss}
      />
    </Container>
  )
}
