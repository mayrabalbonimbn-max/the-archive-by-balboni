import { useEffect, useState } from 'react'
import { attachmentBlob } from '../utils/api'

// disposition: 'view' (default) | 'thumbnail'
export function useAttachmentUrl(id, disposition = 'view') {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let active = true
    let objectUrl = null
    setUrl(null)
    attachmentBlob(id, disposition).then(blob => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => {})

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, disposition])

  return url
}
