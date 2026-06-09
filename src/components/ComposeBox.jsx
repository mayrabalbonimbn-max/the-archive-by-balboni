import { useState, useRef, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import TagInput from './TagInput'
import LinkPreviewCard, { useLinkPreview, extractFirstUrl } from './LinkPreviewCard'
import { getTags } from '../utils/api'
import Editor from 'react-simple-code-editor'
import { CODE_LANGUAGES, highlightCode } from '../utils/codeHighlight'
import { useCollections } from '../hooks/useCollections'
import Icon from './ui/Icon'
import Chip from './ui/Chip'

const MAX_IMAGE_SIZE = 25 * 1024 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const ALLOWED_EXTENSIONS = ['py', 'md', 'pdf', ...IMAGE_EXTENSIONS]

function validateFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'Formato inválido. Use PY, MD, PDF, JPG, PNG ou WebP.'
  const isImage = IMAGE_EXTENSIONS.includes(ext)
  const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
  if (file.size > limit) {
    return isImage ? 'Imagem muito grande. Máximo 25 MB.' : 'Arquivo muito grande. Máximo 10 MB.'
  }
  return null
}

function formatSize(size) {
  return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`
}

const CREATE_TYPES = [
  { id: 'note',     label: 'Nota',       icon: 'note',     hint: 'Um pensamento breve, guardado de passagem' },
  { id: 'article',  label: 'Ensaio',     icon: 'feather',  hint: 'Escrita mais longa, espaço para pensar' },
  { id: 'photo',    label: 'Foto',       icon: 'image',    hint: 'Uma imagem, um momento' },
  { id: 'pdf',      label: 'Documento',  icon: 'pdf',      hint: 'Envie um PDF' },
  { id: 'markdown', label: 'Markdown',   icon: 'markdown', hint: 'Envie um arquivo .md' },
  { id: 'code',     label: 'Código',     icon: 'code',     hint: 'Um script ou trecho de código' },
]

const PRIVACY = [
  ['private',   'Privado'],
  ['followers', 'Círculo'],
  ['public',    'Público'],
]

const FILE_ACCEPT = {
  photo:    'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  pdf:      'application/pdf,.pdf',
  markdown: 'text/markdown,.md',
  code:     'text/x-python,.py',
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

export default function ComposeBox({ profile, onPost, onClose }) {
  const { collections } = useCollections()
  const isDesktop = useIsDesktop()
  const [entryType, setEntryType] = useState('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [privacy, setPrivacy] = useState('private')
  const [attachments, setAttachments] = useState([])
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [fileError, setFileError] = useState('')
  const [posting, setPosting] = useState(false)
  const [mdPreview, setMdPreview] = useState(false)
  const [tags, setTags] = useState([])
  const [tagSuggestions, setTagSuggestions] = useState([])
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)
  const attachmentsRef = useRef([])

  useEffect(() => {
    getTags().then(list => setTagSuggestions(list)).catch(() => {})
  }, [])

  const detectedUrl = extractFirstUrl(body)
  const { preview: linkPreview } = useLinkPreview(!isFile && detectedUrl ? detectedUrl : null)

  const isFile = ['photo', 'pdf', 'markdown', 'code'].includes(entryType)
  const isArticle = entryType === 'article'
  const isCode = entryType === 'code'
  const active = CREATE_TYPES.find(t => t.id === entryType)

  const hasContent = title.trim() || body.trim() || attachments.length > 0 || code.trim()
  const canPost = hasContent && !posting

  useEffect(() => { attachmentsRef.current = attachments }, [attachments])
  useEffect(() => () => {
    attachmentsRef.current.forEach(item => item.preview && URL.revokeObjectURL(item.preview))
  }, [])

  useEffect(() => { titleRef.current?.focus() }, [])

  function openFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.accept = FILE_ACCEPT[entryType] || ''
      fileInputRef.current.click()
    }
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''
    if (!selected.length) return
    const invalid = selected.map(validateFile).find(Boolean)
    if (invalid) { setFileError(invalid); return }
    setFileError('')
    setAttachments(cur => [
      ...cur,
      ...selected.map(f => ({
        file: f,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      })),
    ])
  }

  function removeAttachment(i) {
    setAttachments(cur => {
      const removed = cur[i]
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return cur.filter((_, idx) => idx !== i)
    })
  }

  async function handleSave() {
    if (!canPost) return
    setPosting(true)
    try {
      await onPost({
        content: body.trim(),
        type: isArticle ? 'article' : 'pensamento',
        isArticle,
        articleTitle: isArticle ? title.trim() : undefined,
        visibility: privacy,
        isPrivate: privacy === 'private',
        collectionId: collectionId || undefined,
        attachments,
        codeBlock: isCode && code.trim() ? { language: codeLanguage, code } : null,
        tags,
        linkPreview: linkPreview || undefined,
      })
      onClose?.()
    } catch (err) {
      setFileError(err.message)
    } finally {
      setPosting(false)
    }
  }

  // ── Shared inner content ───────────────────────────────────────────────────

  const content = (
    <>
      {/* Header */}
      <div style={{ flexShrink: 0, ...(!isDesktop ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink)' }}>
            Guardar algo
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)', padding: 0 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canPost}
              style={{
                background: canPost ? 'var(--accent)' : 'var(--surface-3)',
                border: 'none', cursor: canPost ? 'pointer' : 'default',
                fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600,
                color: canPost ? '#fff' : 'var(--ink-3)',
                padding: '8px 18px', borderRadius: 999,
                transition: 'background .15s',
              }}
            >
              {posting ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--line)' }} />
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 18px', scrollbarWidth: 'none' }}>
          {CREATE_TYPES.map(t => {
            const on = t.id === entryType
            return (
              <button
                key={t.id}
                onClick={() => { setEntryType(t.id); setAttachments([]); setCode(''); setFileError('') }}
                style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${on ? 'transparent' : 'var(--line-strong)'}`,
                  background: on ? 'var(--accent)' : 'transparent',
                  color: on ? '#fff' : 'var(--ink-2)',
                  fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
                  transition: 'all .15s',
                }}
              >
                <Icon name={t.icon} size={17} />
                {t.label}
              </button>
            )
          })}
        </div>

        <div style={{ padding: '4px 20px 20px' }}>
          {/* Hint */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginBottom: 16, letterSpacing: '0.04em' }}>
            {active.hint}
          </div>

          {/* Drop zone for file types */}
          {isFile && entryType !== 'code' && (
            <div
              onClick={openFilePicker}
              style={{
                marginBottom: 18, padding: '30px 20px', borderRadius: 16,
                border: '1.5px dashed var(--line-strong)',
                background: 'rgba(255,255,255,0.015)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(232,108,180,0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="upload" size={22} />
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink)' }}>
                Solte seu {entryType === 'photo' ? 'arquivo de imagem' : entryType === 'pdf' ? 'PDF' : 'arquivo Markdown'} aqui
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>
                {isDesktop ? 'ou clique para navegar' : 'ou toque para navegar'}
              </div>
            </div>
          )}

          {/* Code editor */}
          {isCode && (
            <div style={{ marginBottom: 18, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>Linguagem</span>
                <select
                  value={codeLanguage}
                  onChange={e => setCodeLanguage(e.target.value)}
                  style={{ background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: 7, padding: '4px 8px', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 11, outline: 'none' }}
                >
                  {CODE_LANGUAGES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </div>
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={v => highlightCode(v, codeLanguage)}
                padding={14}
                placeholder="Cole ou escreva seu código aqui…"
                textareaClassName="focus:outline-none"
                className="code-editor min-h-[180px] overflow-auto"
                style={{ fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)' }}
                tabSize={2}
                insertSpaces
              />
            </div>
          )}

          {/* Attached files preview */}
          {attachments.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachments.map((item, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-strong)', position: 'relative' }}>
                  {item.preview ? (
                    <img src={item.preview} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{item.file.name.split('.').pop()?.toUpperCase()}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file.name}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{formatSize(item.file.size)}</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {fileError && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#f87171', marginBottom: 12 }}>{fileError}</div>
          )}

          {/* Title input */}
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isArticle ? 'Título' : 'Título (opcional)'}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: 26,
              fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 12,
            }}
          />

          {/* Body textarea / markdown preview */}
          {!isFile && (
            <>
              {(isArticle || body.includes('#') || body.includes('**') || body.includes('- ') || body.includes('> ')) && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {['Escrever', 'Preview'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setMdPreview(tab === 'Preview')}
                      style={{
                        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
                        padding: '3px 10px', borderRadius: 6,
                        border: '1px solid var(--line)',
                        background: (mdPreview ? tab === 'Preview' : tab === 'Escrever') ? 'var(--accent)' : 'transparent',
                        color: (mdPreview ? tab === 'Preview' : tab === 'Escrever') ? '#fff' : 'var(--ink-3)',
                        cursor: 'pointer',
                      }}
                    >{tab}</button>
                  ))}
                </div>
              )}
              {mdPreview ? (
                <div style={{ minHeight: 160, padding: '4px 0' }}>
                  <MarkdownRenderer content={body} />
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={
                    isArticle ? 'Comece a escrever… (suporta Markdown)'
                    : isCode ? '# cole ou descreva seu código…'
                    : 'Escreva o que quer lembrar…'
                  }
                  rows={isFile ? 3 : 9}
                  style={{
                    width: '100%', background: 'none', border: 'none', outline: 'none',
                    resize: 'none', color: 'var(--ink-2)',
                    fontFamily: isArticle ? 'var(--serif)' : 'var(--sans)',
                    fontSize: 15, lineHeight: 1.65,
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Link preview */}
        {!isFile && linkPreview && (
          <div style={{ padding: '0 20px 8px' }}>
            <LinkPreviewCard preview={linkPreview} />
          </div>
        )}

        {/* Meta block */}
        <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px 32px' }}>
          {/* Tags */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>
            TAGS
          </div>
          <div style={{ marginBottom: 22 }}>
            <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>

          {collections.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>
                COLEÇÃO
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
                <Chip active={!collectionId} onClick={() => setCollectionId('')}>Nenhuma</Chip>
                {collections.map(c => (
                  <Chip key={c.id} active={collectionId === c.id} onClick={() => setCollectionId(c.id)}>
                    {c.emoji} {c.name}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>
            QUEM PODE VER
          </div>
          <div style={{ display: 'flex', borderRadius: 12, border: '1px solid var(--line-strong)', overflow: 'hidden', maxWidth: 280 }}>
            {PRIVACY.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPrivacy(id)}
                style={{
                  flex: 1, padding: '10px 0', cursor: 'pointer', border: 'none',
                  background: privacy === id ? 'var(--accent)' : 'transparent',
                  color: privacy === id ? '#fff' : 'var(--ink-2)',
                  fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
                  transition: 'all .15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
    </>
  )

  // ── Desktop: centered modal over dimmed backdrop ───────────────────────────
  if (isDesktop) {
    return (
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 32px 32px', animation: 'dFade .2s ease' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 620, maxHeight: '86vh', background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'dPop var(--dur-sheet) var(--ease-out)' }}
        >
          {content}
        </div>
      </div>
    )
  }

  // ── Mobile: full-screen slide-up sheet ────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#000', display: 'flex', flexDirection: 'column', animation: 'sheetUp var(--dur-sheet) var(--ease-out)' }}>
      {content}
    </div>
  )
}
