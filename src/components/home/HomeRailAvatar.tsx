import { useEffect, useRef, useState } from 'react'
import {
  avatarFallbackDataUri,
  type CompanyAvatarSource,
} from '../../lib/directoryAvatars'

interface ProfileAvatarProps {
  name: string
  profileId: string
  src: string
  className?: string
  alt?: string
  userRole?: string | null
}

/** Always paints an image. Remote 404s fall back to unique initials. */
export function ProfileAvatar({
  name,
  profileId,
  src,
  className,
  alt = '',
  userRole,
}: ProfileAvatarProps) {
  const fallback = avatarFallbackDataUri({
    id: profileId,
    full_name: name,
    user_role: userRole,
  } satisfies CompanyAvatarSource)
  const [uri, setUri] = useState(src || fallback)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setUri(src || fallback)
  }, [src, fallback])

  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth === 0 && uri !== fallback) {
      setUri(fallback)
    }
  }, [uri, fallback])

  return (
    <img
      ref={imgRef}
      src={uri}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (uri !== fallback) setUri(fallback)
      }}
    />
  )
}

/** @deprecated use ProfileAvatar */
export function HomeRailAvatar(props: ProfileAvatarProps) {
  return <ProfileAvatar {...props} />
}
