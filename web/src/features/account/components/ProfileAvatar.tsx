import { useEffect, useState } from 'react'
import { getBackgroundColor, getInitials } from '../lib/avatar'

type ProfileAvatarProps = {
  name: string
  pictureUrl?: string | null
  size?: 'default' | 'small'
}

export function ProfileAvatar({
  name,
  pictureUrl,
  size = 'default',
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [pictureUrl])

  const dimension = size === 'small' ? 'size-8 text-xs' : 'size-18 text-xl'
  const showPicture = Boolean(pictureUrl) && !imageFailed

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${dimension}`}
      style={{ backgroundColor: getBackgroundColor(name) }}
      aria-label={`${name} profile picture`}
      role="img"
    >
      {showPicture ? (
        <img
          key={pictureUrl}
          src={pictureUrl!}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
