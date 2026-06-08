import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from 'react-simple-code-editor'
import { POST_TYPES, TYPE_CONFIG } from '../utils/helpers'
import { CODE_LANGUAGES, highlightCode } from '../utils/codeHighlight'
import { useCollections } from '../hooks/useCollections'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 3
const ALLOWED_EXTENSIONS = ['py', 'md', 'pdf', 'jpg', 'jpeg', 'png', 'webp']

function validateFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) return 'Formato inválido. Use PY, MD, PDF, JPG, PNG ou WebP.'
  if (file.size > MAX_FILE_SIZE) return 'Arquivo muito grande. Máximo 10 MB.'
  return null
}

function formatSize(size) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`
}

const MAX_CHARS = 280
const MAX_CODE_CHARS = 50000

export default function ComposeBox({ profile, onPost, autoFocus = false }) {
  const navigate = useNavigate()
  const { collections } = useCollections()
  const [content, setContent]         = useState('')
  const [type, setType]               = useState('pensamento')
  const [isDiary, setIsDiary]         = useState(false)
  const [visibility, setVisibility]   = useState('private')
  const [isArticle, setIsArticle]     = useState(false)
  const [articleTitle, setArticleTitle] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [focused, setFocused]         = useState(false)
  const [attachments, setAttachments] = useState([])
  const [fileError, setFileError]     = useState('')
  const [posting, setPosting]         = useState(false)
  const [codeOpen, setCodeOpen]       = useState(false)
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [code, setCode]               = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const attachmentsRef = useRef([])

  const chars     = content.length
  const remaining = MAX_CHARS - chars
  const hasAttachments = attachments.length > 0
  const hasCode = code.trim().length > 0
  const articleValid = !isArticle || content.trim().length > 0
  const canPost = (chars > 0 || hasAttachments || hasCode) &&
    (isArticle || chars <= MAX_CHARS) &&
    code.length <= MAX_CODE_CHARS &&
    articleValid &&
    !posting

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  useEffect(() => {
    if (autoFocus) {
      setFocused(true)
      textareaRef.current?.focus()
    }
  }, [autoFocus])

  useEffect(() => { attachmentsRef.current = attachments }, [attachments])
  useEffect(() => () => {
    attachmentsRef.current.forEach(item => item.preview && URL.revokeObjectURL(item.preview))
  }, [])

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''
    if (selected.length === 0) return
    if (attachments.length + selected.length > MAX_ATTACHMENTS) {
      setFileError('Máximo de 3 anexos por post.')
      return
    }
    const invalid = selected.map(validateFile).find(Boolean)
    if (invalid) { setFileError(invalid); return }

    setFileError('')
    setAttachments(current => [
      ...current,
      ...selected.map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      })),
    ])
    setFocused(true)
  }

  function handleRemoveAttachment(index) {
    setAttachments(current => {
      const removed = current[index]
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
    setFileError('')
  }

  function handleAttachmentTitle(index, title) {
    setAttachments(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, title } : item))
  }

  async function handlePost() {
    if (!canPost) return
    setPosting(true)

    try {
      await onPost({
        content: content.trim(), type, isDiary, isPrivate: visibility === 'private', visibility,
        isArticle, articleTitle: isArticle ? articleTitle.trim() : undefined,
        collectionId: collectionId || undefined,
        attachments,
        codeBlock: hasCode ? { language: codeLanguage, code } : null,
      })

      // Reset state
      setContent('')
      setType('pensamento')
      setIsDiary(false)
      setVisibility('private')
      setIsArticle(false)
      setArticleTitle('')
      setCollectionId('')
      setFocused(false)
      attachments.forEach(item => item.preview && URL.revokeObjectURL(item.preview))
      setAttachments([])
      setFileError('')
      setCodeOpen(false)
      setCodeLanguage('javascript')
      setCode('')
    } catch (err) {
      setFileError(err.message)
    } finally {
      setPosting(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handlePost()
  }

  const circleR          = 9
  const circumference    = 2 * Math.PI * circleR
  const progress         = Math.min(chars / MAX_CHARS, 1)
  const strokeDashoffset = circumference * (1 - progress)
  const isWarning        = remaining <= 30 && remaining > 0
  const isOver           = remaining < 0
  const circleColor      = isOver ? '#f87171' : isWarning ? '#fbbf24' : '#f472b6'

  return (
    <div className={`border-b border-dark-border/60 px-5 pt-5 pb-3 transition-all duration-200 ${focused ? 'bg-dark-hover/20' : ''}`}>
      <div className="flex gap-3.5">
        {/* Avatar */}
        <button className="shrink-0 mt-0.5" onClick={() => navigate('/profile')} aria-label="Abrir meu perfil">
          <div className="w-[38px] h-[38px] rounded-full overflow-hidden ring-1 ring-dark-border/50">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold text-sm">
                {profile.name?.[0] || 'M'}
              </div>
            )}
          </div>
        </button>

        {/* Input area */}
        <div className="flex-1 min-w-0">
          {/* Article title */}
          {isArticle && (
            <input
              value={articleTitle}
              onChange={e => setArticleTitle(e.target.value)}
              placeholder="Título do artigo..."
              className="w-full bg-transparent text-dark-text text-[18px] font-semibold placeholder-dark-label/50 resize-none leading-snug mb-2 focus:outline-none tracking-tight font-editorial"
            />
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={isArticle ? 'Escreva seu artigo aqui...' : 'O que você está pensando?'}
            rows={isArticle ? 8 : (focused ? 3 : 2)}
            className="w-full bg-transparent text-dark-text text-[16px] placeholder-dark-label/70 resize-none leading-relaxed mt-1.5 focus:outline-none min-h-[52px] tracking-[-0.005em]"
            style={{ height: 'auto' }}
          />

          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 mb-1 animate-fade-in">
              {attachments.map((item, index) => (
                <div key={`${item.file.name}-${item.file.lastModified}`} className="relative rounded-2xl overflow-hidden border border-dark-border/60 bg-dark-hover/40">
                  {item.preview ? (
                    <>
                      <img src={item.preview} alt={item.file.name} className="w-full h-36 object-cover" />
                      <div className="px-3 py-2 bg-black/55">
                        <input value={item.title || ''} onChange={event => handleAttachmentTitle(index, event.target.value)} placeholder="Título do arquivo..." className="w-full bg-transparent text-xs text-dark-text placeholder-dark-muted focus:outline-none" />
                      </div>
                    </>
                  ) : (
                    <div className="min-h-24 px-4 py-3 flex items-center gap-3">
                      <span className="text-brand-rose text-xs font-bold uppercase shrink-0">{item.file.name.split('.').pop()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-dark-text text-sm truncate">{item.file.name}</p>
                        <p className="text-dark-muted text-xs">{formatSize(item.file.size)}</p>
                        <input value={item.title || ''} onChange={event => handleAttachmentTitle(index, event.target.value)} placeholder="Título do arquivo..." className="mt-2 w-full bg-transparent border-b border-dark-border text-xs text-dark-text placeholder-dark-muted focus:outline-none focus:border-brand-rose" />
                      </div>
                    </div>
                  )}
                  <button onClick={() => handleRemoveAttachment(index)} className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full w-7 h-7 flex items-center justify-center" title="Remover anexo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {fileError && (
            <p className="text-red-400 text-[12px] mt-1 animate-fade-in">{fileError}</p>
          )}

          {codeOpen && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-[#30363d] bg-[#0d1117] animate-fade-in">
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <select value={codeLanguage} onChange={event => setCodeLanguage(event.target.value)} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#c9d1d9] focus:outline-none focus:border-brand-rose">
                  {CODE_LANGUAGES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
                <button onClick={() => { setCodeOpen(false); setCode('') }} className="text-[#8b949e] hover:text-white text-xs">Remover</button>
              </div>
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={value => highlightCode(value, codeLanguage)}
                padding={16}
                placeholder="Escreva ou cole seu código aqui..."
                textareaClassName="focus:outline-none"
                className="code-editor min-h-[180px] max-h-[440px] overflow-auto font-mono text-[13px] leading-relaxed"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                tabSize={2}
                insertSpaces
              />
              <div className={`px-3 py-1.5 text-right text-[11px] border-t border-[#30363d] ${code.length > MAX_CODE_CHARS ? 'text-red-400' : 'text-[#6e7681]'}`}>
                {code.length.toLocaleString('pt-BR')} / {MAX_CODE_CHARS.toLocaleString('pt-BR')}
              </div>
            </div>
          )}

          {/* Expanded options */}
          {focused && (
            <div className="mt-3 animate-fade-in">
              {/* Type selector */}
              {!isArticle && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {POST_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`pill-badge cursor-pointer transition-all duration-150 ${
                        type === t
                          ? TYPE_CONFIG[t].color + ' ring-1 ring-current/50 scale-105'
                          : 'bg-transparent text-dark-muted border border-dark-border hover:border-dark-muted/50 hover:text-dark-text/70'
                      }`}
                    >
                      {TYPE_CONFIG[t].label}
                    </button>
                  ))}
                </div>
              )}

              {/* Collection selector */}
              {collections.length > 0 && (
                <div className="mb-3">
                  <select
                    value={collectionId}
                    onChange={e => setCollectionId(e.target.value)}
                    className="bg-dark-card border border-dark-border rounded-xl px-3 py-1.5 text-xs text-dark-muted focus:border-brand-rose transition-colors focus:outline-none"
                  >
                    <option value="">Sem coleção</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-5 mb-3 text-[13px]">
                <button
                  onClick={() => setIsDiary(v => !v)}
                  className={`flex items-center gap-1.5 transition-colors ${isDiary ? 'text-brand-rose' : 'text-dark-muted hover:text-dark-text/70'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isDiary ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                  </svg>
                  Diário
                </button>
                <select
                  value={visibility}
                  onChange={event => setVisibility(event.target.value)}
                  className="bg-dark-card border border-dark-border rounded-xl px-3 py-1.5 text-xs text-dark-muted focus:border-brand-rose transition-colors focus:outline-none"
                  title="Visibilidade"
                >
                  <option value="private">Privado</option>
                  <option value="followers">Seguidores</option>
                  <option value="public">Público</option>
                </select>
              </div>
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center gap-3 pt-2.5 border-t border-dark-border/50">
            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={posting || attachments.length >= MAX_ATTACHMENTS}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors ${hasAttachments ? 'text-brand-rose bg-brand-rose/10' : 'text-dark-muted hover:text-brand-rose hover:bg-brand-rose/10'}`}
              title="Anexar PY, MD, PDF ou imagem"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
              <span className="hidden sm:inline text-xs font-medium">Anexar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".py,.md,.pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf,text/markdown,text/x-python"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => { setCodeOpen(true); setFocused(true) }}
              disabled={posting}
              className={`px-2 py-1 rounded-lg font-mono text-[13px] transition-colors ${codeOpen ? 'text-brand-rose bg-brand-rose/10' : 'text-dark-muted hover:text-brand-rose hover:bg-brand-rose/10'}`}
              title="Adicionar bloco de código"
            >
              {'</>'}
            </button>

            <button
              onClick={() => { setIsArticle(v => !v); setFocused(true) }}
              disabled={posting}
              className={`px-2 py-1 rounded-lg text-[12px] font-medium tracking-wide transition-colors ${isArticle ? 'text-brand-rose bg-brand-rose/10' : 'text-dark-muted hover:text-brand-rose hover:bg-brand-rose/10'}`}
              title="Modo artigo"
            >
              Artigo
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Char counter */}
            {focused && chars > 0 && !isArticle && (
              <div className="flex items-center gap-2">
                <svg width="22" height="22" className="-rotate-90" style={{ color: circleColor }}>
                  <circle cx="11" cy="11" r={circleR} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
                  <circle
                    cx="11" cy="11" r={circleR}
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                </svg>
                {isWarning && (
                  <span className={`text-xs font-medium tabular-nums ${isOver ? 'text-red-400' : 'text-amber-400'}`}>
                    {remaining}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handlePost}
              disabled={!canPost}
              className="btn-primary text-[13px] px-4 py-1.5"
            >
              {posting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
