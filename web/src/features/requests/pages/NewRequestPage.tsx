import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NewRequestForm } from '../components/NewRequestForm'
import { LinkReveal } from '../components/LinkReveal'
import { requestsApi } from '../api'
import type { CreatedRequest, CreateRequestInput } from '../types'
import styles from './NewRequestPage.module.css'

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
    <div className={styles.page}>
      <h1 className={styles.title}>New document request</h1>
      <NewRequestForm onSubmit={handleCreate} />
      <LinkReveal
        open={created !== null}
        link={created?.link ?? null}
        onClose={dismiss}
      />
    </div>
  )
}
