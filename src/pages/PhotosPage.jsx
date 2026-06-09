import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

function PhotoTile({ photo, onOpen }) {
  const url = useAttachmentUrl(photo.id)
  const title = photo.title || photo.articleTitle || photo.originalName || 'Fotografia'
  return (
    <button onClick={() => url && onOpen(url)} className="group aspect-square rounded-lg overflow-hidden border border-dark-border bg-dark-card text-left">
      {url ? <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" /> : <div className="w-full h-full animate-pulse bg-dark-hover" />}
    </button>
  )
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => { api.get('/archive/photos').then(setPhotos) }, [])

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
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/70 rounded-full px-3 py-2" onClick={() => setOpen(null)}>Fechar</button>
          <img src={open} alt="Fotografia" className="max-w-full max-h-[90vh] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
