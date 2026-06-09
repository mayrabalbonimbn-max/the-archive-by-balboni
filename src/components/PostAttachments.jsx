import { useState } from 'react'
import { attachmentBlob } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

function formatSize(size) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`
}

async function downloadAttachment(attachment) {
  const blob = await attachmentBlob(attachment.id, 'download')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.originalName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function ImageAttachment({ attachment, onOpen }) {
  const thumb = useAttachmentUrl(attachment.id, attachment.hasThumbnail ? 'thumbnail' : 'view')
  return (
    <button onClick={() => thumb && onOpen(attachment)} className="block w-full rounded-2xl overflow-hidden border border-dark-border/50 bg-dark-hover/40">
      {thumb ? <img src={thumb} alt={attachment.originalName} className="w-full max-h-[440px] object-cover hover:opacity-95 transition-opacity" /> : <div className="h-48 animate-pulse bg-dark-hover" />}
    </button>
  )
}

function LightboxImage({ attachment }) {
  const url = useAttachmentUrl(attachment.id, 'view')
  return url
    ? <img src={url} alt={attachment.originalName} className="max-w-full max-h-[80vh] rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
    : <div className="w-12 h-12 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
}

function ExifTag({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-dark-muted bg-dark-hover rounded px-2 py-0.5">
      <span className="text-dark-muted/60">{label}</span>
      <span className="text-dark-text/70">{value}</span>
    </span>
  )
}

export default function PostAttachments({ attachments = [] }) {
  const [textModal, setTextModal] = useState(null)
  const [openImage, setOpenImage] = useState(null)
  const [error, setError] = useState('')

  if (attachments.length === 0) return null
  const images = attachments.filter(item => item.fileType === 'image')
  const files = attachments.filter(item => item.fileType !== 'image')

  async function viewAttachment(attachment) {
    setError('')
    const windowRef = attachment.fileType === 'pdf' ? window.open('', '_blank') : null
    try {
      const blob = await attachmentBlob(attachment.id)
      if (attachment.fileType === 'python' || attachment.fileType === 'markdown') {
        setTextModal({ attachment, content: await blob.text() })
        return
      }
      const url = URL.createObjectURL(blob)
      if (windowRef) {
        windowRef.opener = null
        windowRef.location = url
      }
      else window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      windowRef?.close()
      setError(err.message)
    }
  }

  const exif = openImage?.exifData

  return (
    <>
      {images.length > 0 && (
        <div className={`grid gap-1 mt-2.5 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map(attachment => <ImageAttachment key={attachment.id} attachment={attachment} onOpen={setOpenImage} />)}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-2.5 space-y-2">
          {files.map(attachment => (
            <div key={attachment.id} className="flex items-center gap-3 border border-dark-border/60 bg-dark-hover/30 rounded-xl px-3 py-2.5">
              <span className="text-brand-rose text-[11px] font-bold uppercase w-8">{attachment.fileType === 'markdown' ? 'MD' : attachment.fileType === 'python' ? 'PY' : 'PDF'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-dark-text text-sm truncate">{attachment.originalName}</p>
                <p className="text-dark-muted text-xs">{formatSize(attachment.size)}</p>
              </div>
              <button onClick={() => viewAttachment(attachment)} className="text-brand-rose text-xs hover:underline">Abrir</button>
              <button onClick={() => downloadAttachment(attachment).catch(err => setError(err.message))} className="text-dark-muted text-xs hover:text-dark-text">Baixar</button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {textModal && (
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTextModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border">
              <p className="text-dark-text text-sm font-medium truncate flex-1">{textModal.attachment.originalName}</p>
              <button onClick={() => navigator.clipboard.writeText(textModal.content)} className="text-brand-rose text-xs hover:underline">Copiar conteúdo</button>
              <button onClick={() => setTextModal(null)} className="text-dark-muted hover:text-dark-text">Fechar</button>
            </div>
            <pre className="p-4 overflow-auto text-sm text-dark-text whitespace-pre font-mono leading-relaxed"><code>{textModal.content}</code></pre>
          </div>
        </div>
      )}

      {openImage && (
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4" onClick={() => setOpenImage(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/70 rounded-full px-3 py-2 text-sm" onClick={() => setOpenImage(null)}>Fechar</button>
          <LightboxImage attachment={openImage} />
          {exif && (
            <div className="flex flex-wrap gap-2 justify-center max-w-lg" onClick={e => e.stopPropagation()}>
              {exif.camera && <ExifTag label="câmera" value={exif.camera} />}
              {exif.lens && <ExifTag label="lente" value={exif.lens} />}
              {exif.focalLength && <ExifTag label="focal" value={exif.focalLength} />}
              {exif.aperture && <ExifTag label="abertura" value={exif.aperture} />}
              {exif.shutterSpeed && <ExifTag label="velocidade" value={exif.shutterSpeed} />}
              {exif.iso && <ExifTag label="ISO" value={exif.iso} />}
              {exif.dateTaken && <ExifTag label="data" value={exif.dateTaken} />}
            </div>
          )}
        </div>
      )}
    </>
  )
}
