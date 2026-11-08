import { useState } from 'react'
import { getBackgroundColor, getInitials } from '../lib/avatar'

type ProfileAvatarProps = {
  name: string
  pictureUrl?: string | null
  size?: 'default' | 'small'
}

function ProviderAvatarImage({
  url,
  initials,
}: {
  url: string
  initials: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <>{initials}</>
  }

  return (
    <img
      src={url}
      alt=""
      className="size-full object-cover"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export function ProfileAvatar({
  name,
  pictureUrl,
  size = 'default',
}: ProfileAvatarProps) {
  const dimension = size === 'small' ? 'size-8 text-xs' : 'size-18 text-xl'
  const initials = getInitials(name)

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${dimension}`}
      style={{ backgroundColor: getBackgroundColor(name) }}
      aria-label={`${name} profile picture`}
      role="img"
    >
      {pictureUrl ? (
        <ProviderAvatarImage key={pictureUrl} url={pictureUrl} initials={initials} />
      ) : (
        initials
      )}
    </span>
  )
}
