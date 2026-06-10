import { useState, useRef, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import TagInput from './TagInput'
import LinkPreviewCard, { useLinkPreview, extractFirstUrl } from './LinkPreviewCard'
import { getTags, api } from '../utils/api'
import { useCollections } from '../hooks/useCollections'
import Icon from './ui/Icon'
import Chip from './ui/Chip'
import MentionList from './MentionList'
import { useMention } from '../hooks/useMention'

// ── Categoria detection ────────────────────────────────────────────────────────

export const CATEGORIAS = [
  { id: 'pensamento',  label: 'Pensamento',  color: '#E86CB4' },
  { id: 'reflexão',    label: 'Reflexão',    color: '#6C98E8' },
  { id: 'ideia',       label: 'Ideia',       color: '#82D96C' },
  { id: 'aprendizado', label: 'Aprendizado', color: '#6CE8C8' },
  { id: 'decisão',     label: 'Decisão',     color: '#E8A86C' },
  { id: 'observação',  label: 'Observação',  color: '#A86CE8' },
  { id: 'memória',     label: 'Memória',     color: '#E8D06C' },
  { id: 'citação',     label: 'Citação',     color: '#A0A0A0' },
  { id: 'meta',        label: 'Meta',        color: '#6CE882' },
]

function detectCategoria(text) {
  if (!text || text.trim().length < 15) return null
  const t = text.toLowerCase().trim()
  const words = t.split(/\s+/).filter(Boolean).length

  if (/^["«"'"]/.test(t) || /[—–]\s+[a-záéíóúâêîôûãõç]/i.test(t)) return 'citação'
  if (/\b(aprendi|descobri|entendi|resolvi o|consegui resolver|bug|erro que|funcionou|não funcionava|a solução foi|sintaxe|algoritmo|framework|biblioteca|instalei|configurei|descoberta|lição aprendida)\b/.test(t)) return 'aprendizado'
  if (/\b(e se |tive uma ideia|ideia:|poderia (ser|fazer|criar|virar)|seria interessante|quero criar|quero fazer|que tal |imagina se|e se eu|tenho uma ideia)\b/.test(t)) return 'ideia'
  if (/\b(decidi|resolvi que|escolhi|vou parar|a partir de agora|não vou mais|vou começar a|tomei a decisão|optei por|decidi que)\b/.test(t)) return 'decisão'
  if (/\b(objetivo|minha meta|meu objetivo|meta:|quero chegar|em \d+ (dias|semanas|meses)|até (dezembro|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro)|daqui a)\b/.test(t)) return 'meta'
  if (/\b(lembro|lembrei|me lembro de|quando eu tinha|naquela época|foi o dia|anos atrás|meses atrás|hoje faz|voltei a pensar|aquela vez|de repente lembrei)\b/.test(t)) return 'memória'
  if (/\b(notei|percebi que|é interessante como|curioso|coincidência|incrível como|fascinante|me surpreendeu|impressionante que|estranho que|nunca tinha percebido|só agora percebi)\b/.test(t)) return 'observação'
  if (/\b(me pergunto|será que|por que eu|não sei se|começo a entender|fico pensando|tenho pensado|às vezes me|me faz pensar|comecei a pensar|cada vez mais|tenho a sensação)\b/.test(t)) return 'reflexão'
  if (words > 60) return 'reflexão'
  if (words <= 25) return 'pensamento'
  return 'reflexão'
}

const MAX_IMAGE_SIZE = 25 * 1024 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const ALLOWED_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  'pdf', 'py', 'md', 'markdown',
  'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'sql', 'sh', 'bash', 'txt',
]

function validateFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'Formato inválido. Use PDF, imagens (JPG, PNG, WebP), Markdown, Python ou código (JS, TS, HTML, CSS, JSON, SQL, SH, TXT).'
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
  { id: 'arquivo',  label: 'Arquivo',    icon: 'file',     hint: 'Envie um script Python, JS, HTML ou qualquer arquivo de código' },
  { id: 'code',     label: 'Código',     icon: 'code',     hint: 'Escreva ou cole um trecho de código inline' },
]

const PRIVACY = [
  ['private',   'Privado'],
  ['followers', 'Círculo'],
  ['public',    'Público'],
]

const FILE_ACCEPT = {
  photo:    'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  pdf:      'application/pdf,.pdf',
  markdown: 'text/markdown,.md,.markdown',
  arquivo:  '.py,.js,.jsx,.ts,.tsx,.html,.css,.json,.sql,.sh,.bash,.txt,.md,.markdown,application/pdf,.pdf',
  code:     '.py,.js,.jsx,.ts,.tsx,.html,.css,.json,.sql,.sh,.bash,.txt',
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

export default function ComposeBox({ profile, onPost, onClose, initialContent, parentMemoryPostId }) {
  const { collections } = useCollections()
  const isDesktop = useIsDesktop()
  const [entryType, setEntryType] = useState('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState(initialContent || '')
  const [collectionId, setCollectionId] = useState('')
  const [privacy, setPrivacy] = useState('private')
  const [attachments, setAttachments] = useState([])
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [fileError, setFileError] = useState('')
  const [posting, setPosting] = useState(false)
  const [mdPreview, setMdPreview] = useState(false)
  const [capsuleOption, setCapsuleOption] = useState('now') // 'now' | '1m' | '6m' | '1y' | 'custom'
  const [capsuleCustomDate, setCapsuleCustomDate] = useState('')
  const [capsuleMediaType, setCapsuleMediaType] = useState('text') // 'text' | 'audio' | 'video'
  const [audioState, setAudioState] = useState('idle') // 'idle' | 'recording' | 'recorded'
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioTimer, setAudioTimer] = useState(0)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioTimerIntervalRef = useRef(null)
  const audioChunksRef = useRef([])
  const videoInputRef = useRef(null)
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState([])
  const [tags, setTags] = useState([])
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [categoria, setCategoria] = useState(null)
  const [categoriaManual, setCategoriaManual] = useState(false)
  const [categoriaPicker, setCategoriaPicker] = useState(false)
  const categoriaTimerRef = useRef(null)
  // Code editor loaded on demand (avoids prismjs in initial bundle)
  const [CodeEditorCmp, setCodeEditorCmp] = useState(null)
  const [codeModules, setCodeModules] = useState(null)
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)
  const bodyRef = useRef(null)
  const attachmentsRef = useRef([])
  const mention = useMention(body, setBody, bodyRef)

  useEffect(() => {
    getTags().then(list => setTagSuggestions(list)).catch(() => {})
    api.get('/projects').then(setProjects).catch(() => {})
  }, [])

  const isFile = ['photo', 'pdf', 'markdown', 'arquivo', 'code'].includes(entryType)
  const isArticle = entryType === 'article'
  const isCode = entryType === 'code'
  const isArquivo = entryType === 'arquivo'
  const active = CREATE_TYPES.find(t => t.id === entryType)

  function handleBodyChange(e) {
    const val = e.target.value
    setBody(val)
    mention.check(val, e.target.selectionStart)
  }

  const detectedUrl = extractFirstUrl(body)
  const { preview: linkPreview } = useLinkPreview(!isFile && detectedUrl ? detectedUrl : null)

  const hasCapsuleMedia = (capsuleMediaType === 'audio' && audioBlob != null) || (capsuleMediaType === 'video' && videoFile != null)
  const hasContent = title.trim() || body.trim() || attachments.length > 0 || code.trim() || hasCapsuleMedia
  const canPost = hasContent && !posting

  useEffect(() => { attachmentsRef.current = attachments }, [attachments])
  useEffect(() => () => {
    attachmentsRef.current.forEach(item => item.preview && URL.revokeObjectURL(item.preview))
  }, [])

  useEffect(() => { titleRef.current?.focus() }, [])

  // Load code editor lazily when user picks "Código" type
  useEffect(() => {
    if (!isCode || CodeEditorCmp) return
    Promise.all([
      import('react-simple-code-editor'),
      import('../utils/codeHighlight'),
    ]).then(([{ default: EditorComponent }, mods]) => {
      setCodeEditorCmp(() => EditorComponent)
      setCodeModules(mods)
    })
  }, [isCode, CodeEditorCmp])

  // Auto-detect categoria from body text (debounced, skips if user already chose manually)
  useEffect(() => {
    if (categoriaManual) return
    clearTimeout(categoriaTimerRef.current)
    categoriaTimerRef.current = setTimeout(() => {
      setCategoria(detectCategoria(body))
    }, 400)
    return () => clearTimeout(categoriaTimerRef.current)
  }, [body, categoriaManual])

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

  function formatAudioTimer(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioPreviewUrl(url)
        setAudioState('recorded')
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start(100)
      setAudioState('recording')
      setAudioTimer(0)
      audioTimerIntervalRef.current = setInterval(() => setAudioTimer(t => t + 1), 1000)
    } catch {
      setFileError('Não foi possível acessar o microfone.')
    }
  }

  function stopRecording() {
    clearInterval(audioTimerIntervalRef.current)
    mediaRecorderRef.current?.stop()
  }

  function resetRecording() {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
    setAudioBlob(null)
    setAudioPreviewUrl(null)
    setAudioState('idle')
    setAudioTimer(0)
  }

  function capsuleUnlockDate() {
    if (capsuleOption === 'now') return null
    if (capsuleOption === 'custom') {
      if (!capsuleCustomDate) return null
      // Parse as end of chosen day in local timezone to avoid UTC midnight causing off-by-one
      const [y, m, d] = capsuleCustomDate.split('-').map(Number)
      return new Date(y, m - 1, d, 23, 59, 59).toISOString()
    }
    const d = new Date()
    if (capsuleOption === '1m') d.setMonth(d.getMonth() + 1)
    else if (capsuleOption === '6m') d.setMonth(d.getMonth() + 6)
    else if (capsuleOption === '1y') d.setFullYear(d.getFullYear() + 1)
    return d.toISOString()
  }

  async function handleSave() {
    if (!canPost) return
    setPosting(true)
    const unlockAt = capsuleUnlockDate()
    const isCapsule = capsuleOption !== 'now' && Boolean(unlockAt)

    // Build attachments array — for audio/video capsules, prepend the media file
    let allAttachments = [...attachments]
    if (isCapsule) {
      if (capsuleMediaType === 'audio' && audioBlob) {
        const mt = audioBlob.type || 'audio/webm'
        const ext = mt.includes('mp4') ? 'm4a' : mt.includes('ogg') ? 'ogg' : 'webm'
        allAttachments = [{ file: new File([audioBlob], `capsula-audio.${ext}`, { type: mt }) }, ...allAttachments]
      } else if (capsuleMediaType === 'video' && videoFile) {
        allAttachments = [{ file: videoFile }, ...allAttachments]
      }
    }

    try {
      await onPost({
        content: body.trim(),
        type: isArticle ? 'article' : 'pensamento',
        isArticle,
        articleTitle: title.trim() || undefined,
        visibility: isCapsule ? 'private' : privacy,
        isPrivate: isCapsule ? true : privacy === 'private',
        collectionId: collectionId || undefined,
        attachments: allAttachments,
        codeBlock: isCode && code.trim() ? { language: codeLanguage, code } : null,
        tags,
        linkPreview: linkPreview || undefined,
        isTimeCapsule: isCapsule,
        unlockAt: isCapsule ? unlockAt : undefined,
        projectId: projectId || undefined,
        parentMemoryPostId: parentMemoryPostId || undefined,
        categoria: categoria || undefined,
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
          {isFile && !isCode && (
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
                {entryType === 'photo' ? 'Solte sua foto aqui'
                  : entryType === 'pdf' ? 'Solte seu PDF aqui'
                  : entryType === 'markdown' ? 'Solte seu arquivo .md aqui'
                  : 'Solte seu arquivo aqui'}
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>
                {isArquivo ? '.py .js .jsx .ts .tsx .html .css .json .sql .sh .bash .txt .md .pdf' : isDesktop ? 'ou clique para navegar' : 'ou toque para navegar'}
              </div>
              {isArquivo && (
                <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)' }}>
                  {isDesktop ? 'ou clique para navegar' : 'ou toque para navegar'}
                </div>
              )}
            </div>
          )}

          {/* Code editor — loaded on demand */}
          {isCode && (
            <div style={{ marginBottom: 18, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>Linguagem</span>
                {codeModules ? (
                  <select
                    value={codeLanguage}
                    onChange={e => setCodeLanguage(e.target.value)}
                    style={{ background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: 7, padding: '4px 8px', color: 'var(--ink)', fontFamily: 'var(--mono)', fontSize: 11, outline: 'none' }}
                  >
                    {codeModules.CODE_LANGUAGES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                ) : (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', opacity: 0.5 }}>carregando…</span>
                )}
              </div>
              {CodeEditorCmp && codeModules ? (
                <CodeEditorCmp
                  value={code}
                  onValueChange={setCode}
                  highlight={v => codeModules.highlightCode(v, codeLanguage)}
                  padding={14}
                  placeholder="Cole ou escreva seu código aqui…"
                  textareaClassName="focus:outline-none"
                  className="code-editor min-h-[180px] overflow-auto"
                  style={{ fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)' }}
                  tabSize={2}
                  insertSpaces
                />
              ) : (
                <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
                </div>
              )}
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
          {(!isFile || isArquivo) && (
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
                <div style={{ position: 'relative' }}>
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={handleBodyChange}
                    onKeyDown={e => { if (e.key === 'Escape') mention.close() }}
                    onBlur={() => setTimeout(mention.close, 150)}
                    placeholder={
                      isArticle ? 'Comece a escrever… (suporta Markdown)'
                      : isCode ? '# cole ou descreva seu código…'
                      : 'Escreva o que quer lembrar… use @handle para marcar alguém'
                    }
                    rows={isFile ? 3 : 9}
                    style={{
                      width: '100%', background: 'none', border: 'none', outline: 'none',
                      resize: 'none', color: 'var(--ink-2)',
                      fontFamily: isArticle ? 'var(--serif)' : 'var(--sans)',
                      fontSize: 15, lineHeight: 1.65,
                    }}
                  />
                  <MentionList
                    isOpen={mention.isOpen}
                    results={mention.results}
                    onSelect={mention.select}
                  />
                </div>
              )}
            </>
          )}
          {/* Categoria chip — auto-detected, user can override */}
          {!isFile && categoria && (() => {
            const cat = CATEGORIAS.find(c => c.id === categoria)
            if (!cat) return null
            return (
              <div style={{ position: 'relative', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setCategoriaPicker(p => !p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 11px 5px 9px', borderRadius: 999, cursor: 'pointer',
                    border: `1px solid ${cat.color}44`,
                    background: `${cat.color}12`,
                    fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
                    color: cat.color,
                    transition: 'background .15s, border-color .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${cat.color}20`; e.currentTarget.style.borderColor = `${cat.color}88` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${cat.color}12`; e.currentTarget.style.borderColor = `${cat.color}44` }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill={categoriaManual ? cat.color : 'none'} stroke={cat.color} strokeWidth="1.4" style={{ flexShrink: 0 }}>
                    <circle cx="5" cy="5" r="4" />
                  </svg>
                  {cat.label}
                  {!categoriaManual && (
                    <span style={{ opacity: 0.5, fontSize: 10 }}>· auto</span>
                  )}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginLeft: 1, opacity: 0.6 }}>
                    <polyline points="2,3.5 5,6.5 8,3.5" />
                  </svg>
                </button>

                {categoriaPicker && (
                  <>
                    {/* Close on outside click */}
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 59 }}
                      onClick={() => setCategoriaPicker(false)}
                    />
                    <div style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 60,
                      background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
                      borderRadius: 14, padding: '10px 10px 8px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190,
                    }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--ink-3)', padding: '0 6px 6px', borderBottom: '1px solid var(--line)' }}>
                        NATUREZA DO REGISTRO
                      </div>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {CATEGORIAS.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setCategoria(c.id); setCategoriaManual(true); setCategoriaPicker(false) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                              border: 'none', textAlign: 'left', width: '100%',
                              background: categoria === c.id ? `${c.color}18` : 'transparent',
                              transition: 'background .12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = `${c.color}18`}
                            onMouseLeave={e => e.currentTarget.style.background = categoria === c.id ? `${c.color}18` : 'transparent'}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill={categoria === c.id ? c.color : 'none'} stroke={c.color} strokeWidth="1.5" style={{ flexShrink: 0 }}>
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: categoria === c.id ? c.color : 'var(--ink-2)', fontWeight: categoria === c.id ? 500 : 400 }}>
                              {c.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })()}
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

          {projects.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>
                PROJETO
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
                <Chip active={!projectId} onClick={() => setProjectId('')}>Nenhum</Chip>
                {projects.map(p => (
                  <Chip key={p.id} active={projectId === p.id} onClick={() => setProjectId(p.id)}>
                    {p.emoji} {p.title}
                  </Chip>
                ))}
              </div>
            </>
          )}

          {capsuleOption === 'now' && (
            <>
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
            </>
          )}

          {/* Cápsula do Tempo */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 12 }}>
              CÁPSULA DO TEMPO
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'now',    label: 'Publicar agora' },
                { id: '1m',     label: 'Abrir em 1 mês' },
                { id: '6m',     label: 'Abrir em 6 meses' },
                { id: '1y',     label: 'Abrir em 1 ano' },
                { id: 'custom', label: 'Escolher data' },
              ].map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="capsule"
                    value={opt.id}
                    checked={capsuleOption === opt.id}
                    onChange={() => setCapsuleOption(opt.id)}
                    style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)' }}>{opt.label}</span>
                </label>
              ))}
            </div>

            {capsuleOption === 'custom' && (
              <input
                type="date"
                value={capsuleCustomDate}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                onChange={e => setCapsuleCustomDate(e.target.value)}
                style={{
                  marginTop: 10, padding: '9px 12px', borderRadius: 10,
                  border: '1px solid var(--line-strong)', background: 'var(--surface-2)',
                  fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)',
                  colorScheme: 'dark', outline: 'none',
                }}
              />
            )}

            {/* Media type selector — only when a future date is chosen */}
            {capsuleOption !== 'now' && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 10 }}>
                  FORMATO DA CÁPSULA
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'text',  label: 'Texto',  icon: '✍' },
                    { id: 'audio', label: 'Áudio',  icon: '🎙' },
                    { id: 'video', label: 'Vídeo',  icon: '🎬' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setCapsuleMediaType(t.id); resetRecording(); setVideoFile(null) }}
                      style={{
                        flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: capsuleMediaType === t.id ? 'var(--accent)' : 'var(--surface-2)',
                        color: capsuleMediaType === t.id ? '#fff' : 'var(--ink-3)',
                        fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 500,
                        transition: 'background .15s, color .15s',
                      }}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* Audio recorder */}
                {capsuleMediaType === 'audio' && (
                  <div style={{ marginTop: 14 }}>
                    {audioState === 'idle' && (
                      <button
                        type="button"
                        onClick={startRecording}
                        style={{
                          width: '100%', padding: '14px 0', borderRadius: 12,
                          border: '1px dashed rgba(232,108,180,0.4)', background: 'rgba(232,108,180,0.04)',
                          cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        🎙 Iniciar gravação
                      </button>
                    )}
                    {audioState === 'recording' && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1s ease-in-out infinite' }} />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--ink)', letterSpacing: '0.05em' }}>
                            {formatAudioTimer(audioTimer)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          style={{
                            padding: '10px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'var(--accent)', color: '#fff', fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600,
                          }}
                        >
                          ⏹ Parar
                        </button>
                        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
                      </div>
                    )}
                    {audioState === 'recorded' && audioPreviewUrl && (
                      <div>
                        <audio controls src={audioPreviewUrl} style={{ width: '100%', marginBottom: 10 }} />
                        <button
                          type="button"
                          onClick={resetRecording}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em',
                          }}
                        >
                          ↺ Gravar novamente
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Video picker */}
                {capsuleMediaType === 'video' && (
                  <div style={{ marginTop: 14 }}>
                    {!videoFile ? (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        style={{
                          width: '100%', padding: '14px 0', borderRadius: 12,
                          border: '1px dashed rgba(232,108,180,0.4)', background: 'rgba(232,108,180,0.04)',
                          cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        🎬 Selecionar vídeo
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface-2)' }}>
                        <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🎬 {videoFile.name}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>
                          {formatSize(videoFile.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVideoFile(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, fontSize: 12 }}
                        >✕</button>
                      </div>
                    )}
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (!f) return
                        if (f.size > 200 * 1024 * 1024) { setFileError('Vídeo muito grande. Máximo 200 MB.'); return }
                        setFileError('')
                        setVideoFile(f)
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {capsuleOption !== 'now' && (() => {
              const d = capsuleUnlockDate()
              if (!d) return null
              return (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(232,108,180,0.06)', border: '1px solid rgba(232,108,180,0.2)',
                }}>
                  <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--accent)' }}>
                    Esta entrada será guardada até {new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                  </span>
                </div>
              )
            })()}
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
