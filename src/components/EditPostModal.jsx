import { useEffect, useRef, useState } from 'react'
import { api } from '../utils/api'

export default function EditPostModal({ post, onClose, onSaved }) {
  const [content, setContent] = useState(post.content ?? '')
  const [title, setTitle] = useState(post.articleTitle ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const el = textareaRef.current
    if (el) el.selectionStart = el.selectionEnd = el.value.length
  }, [])

  async function save() {
    if (!content.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const updated = await api.patch(`/posts/${post.id}`, {
        action: 'edit',
        content: content.trim(),
        articleTitle: post.isArticle ? title.trim() || null : null,
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--line)',
        borderRadius: 18, width: '100%', maxWidth: 520,
        padding: '24px', display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', fontStyle: 'italic' }}>
            Editar entrada
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 22, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {post.isArticle && (
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do artigo"
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '10px 14px',
              fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', outline: 'none',
              width: '100%',
            }}
          />
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            borderRadius: 10, padding: '12px 14px',
            fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', outline: 'none',
            resize: 'vertical', lineHeight: 1.6, width: '100%',
          }}
        />

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#f7768e', margin: 0 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: content.trim() && !saving ? 'var(--accent)' : 'var(--surface-3)',
              color: content.trim() && !saving ? '#fff' : 'var(--ink-3)',
              cursor: content.trim() && !saving ? 'pointer' : 'default',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            }}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
