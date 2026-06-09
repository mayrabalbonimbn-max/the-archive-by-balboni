import { useState, useEffect, useCallback } from 'react'
import { api, attachmentBlob } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'
import { formatRelativeTime } from '../utils/helpers'

const FILE_TYPES = [
  { key: 'all', label: 'Tudo' },
  { key: 'image', label: 'Imagens' },
  { key: 'pdf', label: 'PDFs' },
  { key: 'markdown', label: 'Markdown' },
  { key: 'python', label: 'Python' },
]

const FILE_META = {
  image: { label: 'Imagem', badge: 'IMG', color: 'text-fuchsia-300', bg: 'bg-fuchsia-400/10' },
  pdf: { label: 'PDF', badge: 'PDF', color: 'text-red-300', bg: 'bg-red-400/10' },
  markdown: { label: 'Markdown', badge: 'MD', color: 'text-sky-300', bg: 'bg-sky-400/10' },
  python: { label: 'Python', badge: 'PY', color: 'text-blue-300', bg: 'bg-blue-400/10' },
}

const FALLBACK_TITLES = {
  image: 'Imagem da biblioteca',
  pdf: 'Documento PDF',
  markdown: 'Nota em Markdown',
  python: 'Script Python',
}

function formatSize(size) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(size / 1024))} KB`
}

function baseName(name = '') {
  return String(name).split(/[\\/]/).pop().trim()
}

function extensionFrom(name = '') {
  const match = baseName(name).match(/(\.[a-z0-9]{1,8})$/i)
  return match ? match[1].toLowerCase() : ''
}

function stripExtension(name = '') {
  return baseName(name).replace(/\.[a-z0-9]{1,8}$/i, '').trim()
}

function isTechnicalName(name = '') {
  const clean = stripExtension(name)
  if (!clean) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean)) return true
  if (/^[0-9a-f]{24,}$/i.test(clean)) return true
  if (/^[a-z0-9]{28,}$/i.test(clean) && !/[aeiou]{2,}/i.test(clean)) return true
  if (/^(tmp|temp|upload|file|blob|storage|untitled)[-_]?[a-z0-9-]{8,}$/i.test(clean)) return true
  return false
}

function humanizePostContent(content = '') {
  return content
    .replace(/[#*_`>~\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function displayTitle(file) {
  if (file.title?.trim()) return file.title.trim()
  const original = baseName(file.originalName)
  if (original && !isTechnicalName(original)) return original
  if (file.articleTitle?.trim()) return file.articleTitle.trim()
  const fromPost = humanizePostContent(file.postContent)
  if (fromPost) return fromPost
  return FALLBACK_TITLES[file.fileType] || 'Item da biblioteca'
}

function downloadName(file) {
  const title = displayTitle(file)
  const extension = extensionFrom(file.originalName)
  return extension && !title.toLowerCase().endsWith(extension) ? `${title}${extension}` : title
}

function previewLines(text, type) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim())
    .slice(0, type === 'python' ? 5 : 4)

  if (type === 'markdown') {
    return lines.map(line => line.replace(/^#{1,6}\s*/, '').replace(/^[-*]\s+/, ''))
  }
  return lines
}

function FileIcon({ type }) {
  if (type === 'pdf') {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    )
  }

  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d={type === 'python' ? 'M8 16c1.8 1.2 6.2 1.2 8 0M9 11h.01M15 11h.01' : 'M8 12h8M8 16h5'} />
    </svg>
  )
}

function ImagePreview({ file, title, onOpen }) {
  const url = useAttachmentUrl(file.id)

  return (
    <button
      type="button"
      onClick={() => url && onOpen(url)}
      className="block aspect-[4/3] w-full overflow-hidden bg-dark-hover"
      aria-label={`Abrir ${title}`}
    >
      {url ? (
        <img src={url} alt={title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
      ) : (
        <div className="h-full w-full animate-pulse bg-dark-hover" />
      )}
    </button>
  )
}

function TextPreview({ file }) {
  const [lines, setLines] = useState(null)

  useEffect(() => {
    let active = true
    setLines(null)

    attachmentBlob(file.id)
      .then(blob => blob.text())
      .then(text => {
        if (active) setLines(previewLines(text, file.fileType))
      })
      .catch(() => {
        if (active) setLines([])
      })

    return () => {
      active = false
    }
  }, [file.id, file.fileType])

  if (!lines) {
    return <div className="mt-4 h-20 rounded-lg bg-dark-hover/70 animate-pulse" />
  }

  if (lines.length === 0) {
    return <p className="mt-4 text-sm text-dark-muted">Sem preview disponível.</p>
  }

  if (file.fileType === 'python') {
    return (
      <pre className="mt-4 max-h-32 overflow-hidden rounded-lg bg-black/45 border border-dark-border/70 px-3 py-2 text-[11px] leading-relaxed text-dark-text/80 font-mono">
        <code>{lines.join('\n')}</code>
      </pre>
    )
  }

  return (
    <div className="mt-4 space-y-1.5 text-sm leading-relaxed text-dark-text/75">
      {lines.map((line, index) => (
        <p key={`${file.id}-${index}`} className="line-clamp-1">{line}</p>
      ))}
    </div>
  )
}

function DocumentPreview({ file }) {
  const meta = FILE_META[file.fileType] || FILE_META.markdown

  return (
    <div className="aspect-[4/3] bg-gradient-to-br from-dark-card2 to-black border-b border-dark-border/50 px-5 py-5 flex flex-col justify-between">
      <div className={`h-14 w-14 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center`}>
        <FileIcon type={file.fileType} />
      </div>
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${meta.color}`}>{meta.label}</p>
        <p className="mt-1 text-xs text-dark-muted">{file.fileType === 'python' ? 'Código com preview' : file.fileType === 'markdown' ? 'Texto com preview' : 'Ícone e título'}</p>
      </div>
    </div>
  )
}

function LibraryCard({ file, onOpenImage, onOpenText }) {
  const [downloading, setDownloading] = useState(false)
  const title = displayTitle(file)
  const meta = FILE_META[file.fileType] || FILE_META.markdown

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await attachmentBlob(file.id, 'download')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName(file)
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setDownloading(false)
    }
  }

  async function handleView() {
    try {
      const text = await viewFile(file)
      if (text !== null && text !== undefined) onOpenText({ file, content: text })
    } catch {}
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-dark-border bg-dark-card transition-colors hover:border-dark-muted/70 animate-fade-in">
      {file.fileType === 'image' ? (
        <ImagePreview file={file} title={title} onOpen={onOpenImage} />
      ) : (
        <button type="button" onClick={handleView} className="block w-full text-left">
          <DocumentPreview file={file} />
        </button>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-dark-text text-base font-semibold leading-snug line-clamp-2">{title}</h2>
            <p className="mt-1 text-xs text-dark-muted">
              {formatSize(file.size)} · {formatRelativeTime(file.createdAt)}
            </p>
          </div>
          <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold ${meta.color} ${meta.bg}`}>
            {meta.badge}
          </span>
        </div>

        {(file.fileType === 'markdown' || file.fileType === 'python') && <TextPreview file={file} />}
        {file.fileType === 'pdf' && (
          <p className="mt-4 text-sm text-dark-text/70 line-clamp-2">
            {file.articleTitle || humanizePostContent(file.postContent) || 'Documento salvo na biblioteca.'}
          </p>
        )}
        {file.fileType === 'image' && (
          <p className="mt-4 text-sm text-dark-text/70 line-clamp-2">
            {file.articleTitle || humanizePostContent(file.postContent) || 'Imagem salva na biblioteca.'}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-dark-border/60 pt-3">
          <span className="text-xs text-dark-muted">{meta.label}</span>
          <div className="flex items-center gap-2">
            {file.fileType !== 'image' && (
              <button
                onClick={handleView}
                className="inline-flex items-center gap-1.5 rounded-full border border-dark-border px-3 py-1.5 text-xs font-medium text-brand-rose hover:bg-brand-rose/10 transition-colors"
              >
                Abrir
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-full border border-dark-border px-3 py-1.5 text-xs font-medium text-dark-text hover:bg-dark-hover disabled:opacity-40 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? 'Baixando' : 'Baixar'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function LibraryListItem({ file, onOpenImage, onOpenText }) {
  const [downloading, setDownloading] = useState(false)
  const title = displayTitle(file)
  const meta = FILE_META[file.fileType] || FILE_META.markdown

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await attachmentBlob(file.id, 'download')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName(file)
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setDownloading(false)
    }
  }

  async function handleView() {
    try {
      const text = await viewFile(file)
      if (text !== null && text !== undefined) onOpenText({ file, content: text })
    } catch {}
  }

  return (
    <article className="flex gap-3 border-b border-dark-border/60 px-4 py-3 hover:bg-dark-hover/30 transition-colors">
      <div
        className="w-16 h-16 rounded-lg overflow-hidden border border-dark-border bg-dark-card shrink-0 cursor-pointer"
        onClick={file.fileType === 'image' ? undefined : handleView}
      >
        {file.fileType === 'image' ? (
          <ImagePreview file={file} title={title} onOpen={onOpenImage} />
        ) : (
          <div className={`${meta.color} h-full flex items-center justify-center`}><FileIcon type={file.fileType} /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-dark-text text-sm font-semibold truncate">{title}</h2>
        <p className="text-dark-muted text-xs mt-1 truncate">{meta.label} · {formatSize(file.size)} · {formatRelativeTime(file.createdAt)}</p>
        <p className="text-dark-text/60 text-xs mt-1 line-clamp-1">{file.description || file.articleTitle || humanizePostContent(file.postContent) || file.originalName}</p>
      </div>
      <div className="self-center flex gap-2">
        {file.fileType !== 'image' && (
          <button onClick={handleView} className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-brand-rose hover:bg-brand-rose/10">
            Abrir
          </button>
        )}
        <button onClick={handleDownload} disabled={downloading} className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-dark-text hover:bg-dark-hover disabled:opacity-40">
          Baixar
        </button>
      </div>
    </article>
  )
}

async function viewFile(file) {
  if (file.fileType === 'image') return
  const windowRef = file.fileType === 'pdf' ? window.open('', '_blank') : null
  try {
    const blob = await attachmentBlob(file.id)
    if (file.fileType === 'python' || file.fileType === 'markdown') {
      return blob.text()
    }
    const url = URL.createObjectURL(blob)
    if (windowRef) {
      windowRef.opener = null
      windowRef.location = url
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return null
  } catch (err) {
    windowRef?.close()
    throw err
  }
}

export default function LibraryPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [viewMode, setViewMode] = useState('gallery')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [textModal, setTextModal] = useState(null)
  const [viewError, setViewError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (activeType !== 'all') params.set('type', activeType)
      const data = await api.get(`/library?${params}`)
      setFiles(data)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, activeType])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Acervo pessoal</p>
          <h1 className="font-bold text-2xl text-dark-text mt-1">Biblioteca</h1>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título ou nome do arquivo..."
          className="input-dark text-sm py-2.5 mb-3"
        />
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {FILE_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`filter-tab shrink-0 px-3 py-1.5 text-xs ${activeType === t.key ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-3 inline-flex rounded-lg border border-dark-border overflow-hidden">
          <button onClick={() => setViewMode('gallery')} className={`px-3 py-1.5 text-xs ${viewMode === 'gallery' ? 'bg-dark-hover text-dark-text' : 'text-dark-muted'}`}>Galeria</button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs ${viewMode === 'list' ? 'bg-dark-hover text-dark-text' : 'text-dark-muted'}`}>Lista</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="h-14 w-14 rounded-lg border border-dark-border bg-dark-card flex items-center justify-center text-dark-muted mb-4">
            <FileIcon type="markdown" />
          </div>
          <p className="text-dark-text/70 font-medium">
            {debouncedSearch ? 'Nenhum item encontrado' : 'Biblioteca vazia'}
          </p>
          <p className="text-dark-muted text-sm mt-1">
            {debouncedSearch ? 'Tente buscar por outro título' : 'Anexe imagens, PDFs, Markdown e Python nos seus posts'}
          </p>
        </div>
      ) : (
        <section className="px-4 py-5">
          <p className="mb-4 text-dark-muted text-xs">
            {files.length} {files.length === 1 ? 'item no acervo' : 'itens no acervo'}
          </p>
          {viewMode === 'gallery' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {files.map(file => (
                <LibraryCard key={file.id} file={file} onOpenImage={setImageUrl} onOpenText={setTextModal} />
              ))}
            </div>
          ) : (
            <div className="border border-dark-border rounded-lg overflow-hidden bg-dark-card">
              {files.map(file => (
                <LibraryListItem key={file.id} file={file} onOpenImage={setImageUrl} onOpenText={setTextModal} />
              ))}
            </div>
          )}
        </section>
      )}

      {imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setImageUrl(null)}>
          <button className="absolute top-4 right-4 text-white bg-black/70 rounded-full px-3 py-2" onClick={() => setImageUrl(null)}>Fechar</button>
          <img src={imageUrl} alt="Imagem da biblioteca" className="max-w-full max-h-[90vh] rounded-lg object-contain" onClick={event => event.stopPropagation()} />
        </div>
      )}

      {textModal && (
        <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTextModal(null)}>
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border">
              <p className="text-dark-text text-sm font-medium truncate flex-1">{displayTitle(textModal.file)}</p>
              <button onClick={() => navigator.clipboard.writeText(textModal.content)} className="text-brand-rose text-xs hover:underline">Copiar</button>
              <button
                onClick={async () => {
                  const blob = await attachmentBlob(textModal.file.id, 'download')
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = downloadName(textModal.file)
                  a.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
                className="text-dark-muted text-xs hover:text-dark-text"
              >
                Baixar
              </button>
              <button onClick={() => setTextModal(null)} className="text-dark-muted hover:text-dark-text text-sm">Fechar</button>
            </div>
            <pre className="p-4 overflow-auto text-sm text-dark-text whitespace-pre font-mono leading-relaxed flex-1">
              <code>{textModal.content}</code>
            </pre>
          </div>
        </div>
      )}

      {viewError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 text-sm px-4 py-2 rounded-xl">
          {viewError}
        </div>
      )}
    </div>
  )
}
