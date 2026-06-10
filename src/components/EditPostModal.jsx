import { useEffect, useRef, useState } from 'react'
import { api } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

const VISIBILITY_OPTIONS = [
  { value: 'private',   label: 'Privado',     icon: '🔒' },
  { value: 'followers', label: 'Seguidores',  icon: '👥' },
  { value: 'friends',   label: 'Amigos',      icon: '💚' },
  { value: 'public',    label: 'Público',     icon: '🌐' },
]

const MAX_ATTACHMENTS = 3

function AttachmentThumb({ id, onDelete, deleting }) {
  const url = useAttachmentUrl(id, 'thumbnail')
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      {url
        ? <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)', display: 'block' }} />
        : <div style={{ width: 72, height: 72, borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--line)' }} />
      }
      <button
        onClick={onDelete}
        disabled={deleting}
        style={{
          position: 'absolute', top: -6, right: -6,
          width: 20, height: 20, borderRadius: '50%',
          background: deleting ? 'var(--surface-3)' : '#1a1a1a',
          border: '1px solid var(--line)', cursor: deleting ? 'default' : 'pointer',
          color: 'var(--ink)', fontSize: 12, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {deleting ? '…' : '×'}
      </button>
    </div>
  )
}

export default function EditPostModal({ post, onClose, onSaved }) {
  const [content, setContent]           = useState(post.content ?? '')
  const [title, setTitle]               = useState(post.articleTitle ?? '')
  const [visibility, setVisibility]     = useState(post.visibility ?? 'private')
  const [tagInput, setTagInput]         = useState((post.tags ?? []).join(', '))
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const imageAttachments = (post.attachments ?? []).filter(a => a.fileType === 'image')
  const [localAttachments, setLocalAttachments] = useState(imageAttachments)
  const [deletingId, setDeletingId]     = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError]     = useState('')

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const el = textareaRef.current
    if (el) el.selectionStart = el.selectionEnd = el.value.length
  }, [])

  async function handleDeletePhoto(id) {
    setDeletingId(id)
    setPhotoError('')
    try {
      await api.delete(`/attachments/${id}`)
      setLocalAttachments(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      setPhotoError(err.message || 'Erro ao remover foto.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAddPhoto(e) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    if (!file) return

    setUploadingPhoto(true)
    setPhotoError('')
    try {
      const form = new FormData()
      form.append('files', file)
      const added = await api.upload(`/posts/${post.id}/attachments`, form)
      setLocalAttachments(prev => [...prev, ...added.filter(a => a.fileType === 'image')])
    } catch (err) {
      setPhotoError(err.message || 'Erro ao adicionar foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function save() {
    if (!content.trim() || saving) return
    setSaving(true)
    setError('')
    const tags = tagInput.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean)
    try {
      const updated = await api.patch(`/posts/${post.id}`, {
        action: 'edit',
        content: content.trim(),
        articleTitle: post.isArticle ? title.trim() || null : null,
        visibility,
        tags,
      })
      onSaved({ ...updated, attachments: localAttachments })
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const S = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0',
    },
    sheet: {
      background: 'var(--surface-1)', border: '1px solid var(--line)',
      borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600,
      padding: '22px 22px 40px', display: 'flex', flexDirection: 'column', gap: 14,
      maxHeight: '92dvh', overflowY: 'auto',
    },
    label: {
      display: 'block', fontFamily: 'var(--mono)', fontSize: 10,
      letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 6,
    },
    input: {
      width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)',
      borderRadius: 10, padding: '10px 14px',
      fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', outline: 'none',
      boxSizing: 'border-box',
    },
  }

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={S.sheet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', fontStyle: 'italic' }}>
            Editar entrada
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {post.isArticle && (
          <div>
            <label style={S.label}>TÍTULO</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título do artigo"
              style={{ ...S.input, fontFamily: 'var(--serif)', fontSize: 17 }}
            />
          </div>
        )}

        <div>
          <label style={S.label}>CONTEÚDO</label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={8}
            style={{ ...S.input, resize: 'vertical', lineHeight: 1.65 }}
          />
        </div>

        <div>
          <label style={S.label}>VISIBILIDADE</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {VISIBILITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setVisibility(opt.value)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${visibility === opt.value ? 'var(--accent)' : 'var(--line)'}`,
                  background: visibility === opt.value ? 'rgba(232,108,180,0.08)' : 'var(--surface-2)',
                  fontFamily: 'var(--sans)', fontSize: 11.5,
                  color: visibility === opt.value ? 'var(--accent)' : 'var(--ink-3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 14 }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo attachments */}
        {!post.isTimeCapsule && (
          <div>
            <label style={S.label}>FOTOS</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {localAttachments.map(att => (
                <AttachmentThumb
                  key={att.id}
                  id={att.id}
                  deleting={deletingId === att.id}
                  onDelete={() => handleDeletePhoto(att.id)}
                />
              ))}
              {localAttachments.length < MAX_ATTACHMENTS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    width: 72, height: 72, borderRadius: 8, flexShrink: 0,
                    border: '1px dashed var(--line)', background: 'var(--surface-2)',
                    cursor: uploadingPhoto ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 4, color: 'var(--ink-3)',
                    fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{uploadingPhoto ? '…' : '+'}</span>
                  {!uploadingPhoto && 'FOTO'}
                </button>
              )}
            </div>
            {photoError && (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#f7768e', margin: '6px 0 0' }}>{photoError}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAddPhoto}
            />
          </div>
        )}

        <div>
          <label style={S.label}>TAGS (separadas por vírgula)</label>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="ex: fotografia, reflexão, ideias"
            style={S.input}
          />
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#f7768e', margin: 0 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 14,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!content.trim() || saving}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: content.trim() && !saving ? 'var(--accent)' : 'var(--surface-3)',
              color: content.trim() && !saving ? '#fff' : 'var(--ink-3)',
              cursor: content.trim() && !saving ? 'pointer' : 'default',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            }}
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
