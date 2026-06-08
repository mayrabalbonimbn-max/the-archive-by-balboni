import { useEffect, useState } from 'react'
import { attachmentBlob } from '../utils/api'

export function useAttachmentUrl(id) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let active = true
    let objectUrl = null
    setUrl(null)
    attachmentBlob(id).then(blob => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => {})

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  return url
}
