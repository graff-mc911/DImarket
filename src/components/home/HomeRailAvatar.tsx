import { useState } from 'react'
import { companyLogoDataUri } from '../../lib/directoryAvatars'

interface HomeRailAvatarProps {
  name: string
  profileId: string
  src: string
}

/** Home rail photo with a unique monogram fallback if the remote file 404s. */
export function HomeRailAvatar({ name, profileId, src }: HomeRailAvatarProps) {
  const fallback = companyLogoDataUri(name, profileId)
  const [uri, setUri] = useState(src || fallback)

  return (
    <img
      src={uri}
      alt=""
      loading="lazy"
      onError={() => {
        if (uri !== fallback) setUri(fallback)
      }}
    />
  )
}
