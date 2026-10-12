import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="flex flex-col gap-6 sm:gap-8 py-6 sm:py-10">
      <h1 className="text-xl leading-[1.5] font-semibold tracking-tight text-ink sm:text-[1.375rem]">
        New document request
      </h1>
      <NewRequestForm onSubmit={handleCreate} />
      <LinkReveal
        open={created !== null}
        link={created?.link ?? null}
        onClose={dismiss}
      />
    </div>
  )
}
