import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { formatRelativeTime } from '../utils/helpers'

export default function CommentsBox({ postId, initialCount = 0, autoOpen = false, highlightId = null }) {
  const [open, setOpen] = useState(autoOpen)
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [editing, setEditing] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(initialCount)
  const commentRefs = useRef({})

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get(`/posts/${postId}/comments`)
      setComments(data)
      setCount(data.length)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-open: load comments immediately on mount when directed from notification
  useEffect(() => {
    if (autoOpen) load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to and highlight the target comment after comments load
  useEffect(() => {
    if (!highlightId || comments.length === 0) return
    const el = commentRefs.current[highlightId]
    if (!el) return
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }, [comments, highlightId])

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && comments.length === 0) await load()
  }

  async function addComment(e) {
    e?.preventDefault()
    if (!content.trim()) return
    try {
      await api.post(`/posts/${postId}/comments`, { content })
      setContent('')
      await load()
    } catch (err) { setError(err.message) }
  }

  async function addReply(commentId) {
    if (!replyContent.trim()) return
    try {
      await api.post(`/comments/${commentId}/replies`, { content: replyContent })
      setReplyContent('')
      setReplyingTo(null)
      await load()
    } catch (err) { setError(err.message) }
  }

  async function removeComment(id) {
    try { await api.delete(`/comments/${id}`); await load() }
    catch (err) { setError(err.message) }
  }

  async function removeReply(id) {
    try { await api.delete(`/replies/${id}`); await load() }
    catch (err) { setError(err.message) }
  }

  async function saveEdit() {
    if (!editing || !editContent.trim()) return
    try {
      const path = editing.kind === 'reply' ? `/replies/${editing.id}` : `/comments/${editing.id}`
      await api.patch(path, { content: editContent })
      setEditing(null); setEditContent('')
      await load()
    } catch (err) { setError(err.message) }
  }

  const S = {
    root: { borderTop: '1px solid var(--line)', marginTop: 12 },
    toggle: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 0 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.05em', color: 'var(--ink-3)' },
    box: { marginTop: 10, borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(255,255,255,0.025)', padding: '12px 12px 10px' },
    row: { display: 'flex', gap: 8, marginBottom: 10 },
    input: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 11px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', outline: 'none', resize: 'none' },
    sendBtn: { background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
    comment: { borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 8 },
    meta: { fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 3 },
    text: { fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    actions: { display: 'flex', gap: 12, marginTop: 4 },
    action: { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', padding: 0 },
    replies: { marginLeft: 14, paddingLeft: 10, borderLeft: '1px solid var(--line)', marginTop: 8 },
    reply: { marginBottom: 8 },
    replyRow: { display: 'flex', gap: 8, marginTop: 8, marginLeft: 14 },
  }

  const commentIcon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )

  return (
    <div style={S.root}>
      <button style={S.toggle} onClick={e => { e.stopPropagation(); toggleOpen() }}>
        {commentIcon}
        {count > 0 ? `${count} comentário${count !== 1 ? 's' : ''}` : 'Comentar'}
      </button>

      {open && (
        <div style={S.box} onClick={e => e.stopPropagation()}>
          {/* Compose */}
          <form style={S.row} onSubmit={addComment}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment() }}
              placeholder="Escreva um comentário…"
              rows={1}
              style={S.input}
            />
            <button type="submit" style={S.sendBtn} disabled={!content.trim()}>Enviar</button>
          </form>

          {loading && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', padding: '4px 0' }}>Carregando…</p>}
          {error && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#f7768e', padding: '4px 0' }}>{error}</p>}

          {comments.map((comment, i) => {
            const isHighlighted = highlightId === comment.id
            return (
              <div
                key={comment.id}
                ref={el => { commentRefs.current[comment.id] = el }}
                style={{
                  ...S.comment,
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  paddingTop: i === 0 ? 4 : 10,
                  marginTop: i === 0 ? 0 : 8,
                  ...(isHighlighted ? {
                    outline: '1.5px solid var(--accent)',
                    outlineOffset: 6,
                    borderRadius: 6,
                  } : {}),
                }}
              >
                <p style={S.meta}>{comment.author.name} · {formatRelativeTime(comment.createdAt)}</p>

                {editing?.kind === 'comment' && editing.id === comment.id ? (
                  <div style={S.row}>
                    <input value={editContent} onChange={e => setEditContent(e.target.value)} style={{ ...S.input, flex: 1 }} />
                    <button onClick={saveEdit} style={{ ...S.sendBtn, background: 'var(--surface-3)', color: 'var(--ink)' }}>Salvar</button>
                  </div>
                ) : (
                  <p style={S.text}>{comment.content}</p>
                )}

                <div style={S.actions}>
                  <button style={S.action} onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                    {replyingTo === comment.id ? 'Cancelar' : 'Responder'}
                  </button>
                  {comment.canEdit && (
                    <>
                      <button style={S.action} onClick={() => { setEditing({ kind: 'comment', id: comment.id }); setEditContent(comment.content) }}>Editar</button>
                      <button style={{ ...S.action, color: '#f7768e' }} onClick={() => removeComment(comment.id)}>Excluir</button>
                    </>
                  )}
                </div>

                {comment.replies?.length > 0 && (
                  <div style={S.replies}>
                    {comment.replies.map(reply => (
                      <div key={reply.id} style={S.reply}>
                        <p style={S.meta}>{reply.author.name} · {formatRelativeTime(reply.createdAt)}</p>
                        {editing?.kind === 'reply' && editing.id === reply.id ? (
                          <div style={S.row}>
                            <input value={editContent} onChange={e => setEditContent(e.target.value)} style={{ ...S.input, flex: 1 }} />
                            <button onClick={saveEdit} style={{ ...S.sendBtn, background: 'var(--surface-3)', color: 'var(--ink)' }}>Salvar</button>
                          </div>
                        ) : (
                          <p style={S.text}>{reply.content}</p>
                        )}
                        {reply.canEdit && (
                          <div style={S.actions}>
                            <button style={S.action} onClick={() => { setEditing({ kind: 'reply', id: reply.id }); setEditContent(reply.content) }}>Editar</button>
                            <button style={{ ...S.action, color: '#f7768e' }} onClick={() => removeReply(reply.id)}>Excluir</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === comment.id && (
                  <div style={S.replyRow}>
                    <input
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addReply(comment.id) }}
                      placeholder={`Responder ${comment.author.name}…`}
                      style={{ ...S.input, flex: 1 }}
                      autoFocus
                    />
                    <button onClick={() => addReply(comment.id)} style={S.sendBtn} disabled={!replyContent.trim()}>Enviar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
