import type { ReactNode } from 'react'
import { AlertIcon } from '../icons'
import { StateMessage } from './StateMessage'

export type ErrorStateProps = {
  title?: string
  message?: ReactNode
  action?: ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: ErrorStateProps) {
  return (
    <StateMessage
      title={title}
      message={message}
      action={action}
      icon={<AlertIcon size={24} />}
    />
  )
}
