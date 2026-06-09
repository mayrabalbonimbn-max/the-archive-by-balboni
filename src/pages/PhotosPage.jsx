import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

function PhotoTile({ photo, onOpen }) {
  const thumb = useAttachmentUrl(photo.id, photo.hasThumbnail ? 'thumbnail' : 'view')
  const title = photo.title || photo.articleTitle || photo.originalName || 'Fotografia'
  return (
    <button onClick={() => thumb && onOpen(photo)} className="group aspect-square rounded-lg overflow-hidden border border-dark-border bg-dark-card text-left">
      {thumb ? <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" /> : <div className="w-full h-full animate-pulse bg-dark-hover" />}
    </button>
  )
}

function LightboxImage({ photo }) {
  const url = useAttachmentUrl(photo.id, 'view')
  return url
    ? <img src={url} alt={photo.title || photo.originalName || 'Fotografia'} className="max-w-full max-h-[80vh] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
    : <div className="w-16 h-16 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
}

function ExifTag({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-dark-muted bg-dark-hover rounded px-2 py-0.5">
      <span className="text-dark-muted/60">{label}</span>
      <span className="text-dark-text/70">{value}</span>
    </span>
  )
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => { api.get('/archive/photos').then(setPhotos) }, [])

  const exif = open?.exifData

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Arquivo visual</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">Fotografias</h1>
      </div>
      {!photos ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" /></div>
      ) : photos.length === 0 ? (
        <div className="py-16 text-center text-dark-muted text-sm">Nenhuma fotografia ainda.</div>
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => <PhotoTile key={photo.id} photo={photo} onOpen={setOpen} />)}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center p-4 gap-3" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/70 rounded-full px-3 py-2 text-sm" onClick={() => setOpen(null)}>Fechar</button>
          <LightboxImage photo={open} />
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
    </div>
  )
}
