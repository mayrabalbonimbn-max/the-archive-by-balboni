import { useEffect, useState } from 'react'
import { publicProfileMediaBlob } from '../utils/api'

const cache = new Map()   // profileId → blob URL string
const pending = new Map() // profileId → Promise<string|null>

export function useAvatarUrl(profileId, rawSrc) {
  const isAlreadyResolved = !rawSrc || rawSrc.startsWith('blob:') || rawSrc.startsWith('http')

  const [src, setSrc] = useState(() => {
    if (isAlreadyResolved) return rawSrc || null
    return cache.get(profileId) ?? null
  })

  useEffect(() => {
    if (!rawSrc) { setSrc(null); return }
    if (rawSrc.startsWith('blob:') || rawSrc.startsWith('http')) { setSrc(rawSrc); return }
    if (!profileId) return
    if (cache.has(profileId)) { setSrc(cache.get(profileId)); return }

    let alive = true

    let p = pending.get(profileId)
    if (!p) {
      p = publicProfileMediaBlob(profileId, 'avatar')
        .then(blob => {
          const url = URL.createObjectURL(blob)
          cache.set(profileId, url)
          return url
        })
        .catch(() => null)
        .finally(() => pending.delete(profileId))
      pending.set(profileId, p)
    }

    p.then(url => { if (alive && url) setSrc(url) })

    return () => { alive = false }
  }, [profileId, rawSrc])

  return src
}
