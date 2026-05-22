/** Офіційні ролики брендів через YouTube (без звуку, autoplay) */
export function parseYoutubeVideoId(url: string): string | null {
  if (!url) return null
  if (url.startsWith('youtube:')) return url.slice(8).trim() || null

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace(/^\//, '').split('/')[0] || null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v) return v
      const embed = parsed.pathname.match(/\/embed\/([^/?]+)/)
      if (embed?.[1]) return embed[1]
    }
  } catch {
    return null
  }
  return null
}

export function isYoutubeMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return parseYoutubeVideoId(url) !== null
}

export function youtubePosterUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function youtubeEmbedSrc(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}
