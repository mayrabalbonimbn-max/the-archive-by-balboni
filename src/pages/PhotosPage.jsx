import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

function PhotoTile({ photo, onOpen }) {
  const thumb = useAttachmentUrl(photo.id, photo.hasThumbnail ? 'thumbnail' : 'view')
  const title = photo.title || photo.articleTitle || photo.originalName || 'Fotografia'
  return (
    <button
      onClick={() => onOpen(photo)}
      style={{ touchAction: 'manipulation', cursor: 'pointer' }}
      className="group aspect-square rounded-lg overflow-hidden border border-dark-border bg-dark-card"
    >
      {thumb
        ? <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
        : <div className="w-full h-full animate-pulse bg-dark-hover" />}
    </button>
  )
}

function Lightbox({ photo, onClose }) {
  const url = useAttachmentUrl(photo.id, 'view')
  const exif = photo.exifData

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, gap: 12,
      }}
      onClick={onClose}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute', top: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))', right: 16,
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 999,
          color: '#fff', padding: '8px 14px', fontSize: 13, cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        Fechar
      </button>

      {url
        ? <img
            src={url}
            alt={photo.title || photo.originalName || 'Fotografia'}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 10, objectFit: 'contain' }}
          />
        : <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e8697a', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      }

      {exif && (
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 480 }}
          onClick={e => e.stopPropagation()}
        >
          {exif.camera && <ExifPill label="câmera" value={exif.camera} />}
          {exif.lens && <ExifPill label="lente" value={exif.lens} />}
          {exif.focalLength && <ExifPill label="focal" value={exif.focalLength} />}
          {exif.aperture && <ExifPill label="abertura" value={exif.aperture} />}
          {exif.shutterSpeed && <ExifPill label="velocidade" value={exif.shutterSpeed} />}
          {exif.iso && <ExifPill label="ISO" value={exif.iso} />}
          {exif.dateTaken && <ExifPill label="data" value={exif.dateTaken} />}
        </div>
      )}

      <p style={{ color: '#666', fontSize: 11 }} onClick={e => e.stopPropagation()}>
        {photo.originalName}
      </p>
    </div>
  )
}

function ExifPill({ label, value }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, fontSize: 11, color: '#aaa', background: '#1a1a1a', borderRadius: 4, padding: '2px 8px' }}>
      <span style={{ color: '#555' }}>{label}</span>
      <span>{value}</span>
    </span>
  )
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    api.get('/archive/photos').then(setPhotos).catch(() => setPhotos([]))
  }, [])

  return (
    <>
      <div style={{ position: 'sticky', top: 'env(safe-area-inset-top, 0px)', zIndex: 10 }} className="bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Arquivo visual</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">Fotografias</h1>
      </div>

      {!photos ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="py-16 text-center text-dark-muted text-sm">Nenhuma fotografia ainda.</div>
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <PhotoTile key={photo.id} photo={photo} onOpen={setOpen} />
          ))}
        </div>
      )}

      {open && <Lightbox photo={open} onClose={() => setOpen(null)} />}
    </>
  )
}
