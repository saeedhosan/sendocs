import { Spinner } from '../ui'
import { StateMessage } from './StateMessage'

export type LoadingStateProps = {
  title?: string
  message?: string
}

export function LoadingState({
  title = 'Loading',
  message,
}: LoadingStateProps) {
  return <StateMessage title={title} message={message} icon={<Spinner size={24} />} />
}
