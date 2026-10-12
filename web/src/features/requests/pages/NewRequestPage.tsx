import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/ui'
import { requestsApi } from '../api'
import { LinkReveal } from '../components/LinkReveal'
import { NewRequestForm } from '../components/NewRequestForm'
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
    <div className="flex flex-col gap-6 mb-20">
      <PageHeader
        title="New document request"
        subtitle="Create a secure link so a client can upload the documents you need."
      />
      <NewRequestForm onSubmit={handleCreate} />
      <LinkReveal
        open={created !== null}
        link={created?.link ?? null}
        onClose={dismiss}
      />
    </div>
  )
}
