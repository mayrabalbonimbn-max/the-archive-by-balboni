import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

function Bubble({ msg }) {
  const ts = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div style={{ display: 'flex', justifyContent: msg.mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{
        maxWidth: '75%', padding: '9px 13px', borderRadius: msg.mine ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
        background: msg.mine ? 'var(--accent)' : 'var(--surface-2)',
        color: msg.mine ? '#fff' : 'var(--ink)',
        fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.5,
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{ts}</div>
      </div>
    </div>
  )
}

export default function ConversationPage({ profile }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [participant, setParticipant] = useState(null)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const pollRef = useRef(null)

  async function load() {
    try {
      const data = await api.get(`/conversations/${id}/messages`)
      setMessages(data)
      if (data.length > 0 && !participant) {
        const other = data.find(m => !m.mine)
        if (other) setParticipant(other.sender)
      }
    } catch (err) {
      console.error('[ConversationPage] load failed:', err?.message)
      setError(err?.message || 'Não foi possível carregar a conversa.')
    }
  }

  useEffect(() => {
    // Also get participant name from conversation list
    api.get('/conversations').then(list => {
      const conv = list.find(c => c.id === id)
      if (conv) setParticipant(conv.participant)
    }).catch(() => {})
    load()
    pollRef.current = setInterval(load, 4000)
    return () => clearInterval(pollRef.current)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e?.preventDefault()
    if (!content.trim() || sending) return
    setSending(true)
    setError('')
    const optimistic = { id: `tmp-${Date.now()}`, content: content.trim(), mine: true, createdAt: new Date().toISOString() }
    setMessages(m => [...m, optimistic])
    const sent = content.trim()
    setContent('')
    try {
      const msg = await api.post(`/conversations/${id}/messages`, { content: sent })
      setMessages(m => m.map(x => x.id === optimistic.id ? { ...msg, mine: true } : x))
    } catch (err) {
      setError(err.message)
      setMessages(m => m.filter(x => x.id !== optimistic.id))
      setContent(sent)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const grouped = messages.reduce((acc, msg) => {
    const day = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
    if (!acc.length || acc[acc.length - 1].day !== day) acc.push({ day, msgs: [] })
    acc[acc.length - 1].msgs.push(msg)
    return acc
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AppBar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/messages')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}>
              <Icon name="back" size={22} />
            </button>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', fontStyle: 'italic' }}>
              {participant?.name ?? '…'}
            </span>
          </div>
        }
      />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', textAlign: 'center', marginTop: 40 }}>
            Início da conversa
          </p>
        )}
        {grouped.map(group => (
          <div key={group.day}>
            <div style={{ textAlign: 'center', margin: '10px 0 8px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 20 }}>{group.day}</span>
            </div>
            {group.msgs.map(msg => <Bubble key={msg.id} msg={msg} />)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p style={{ padding: '4px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: '#f7768e' }}>{error}</p>}

      {/* Compose */}
      <form
        onSubmit={send}
        style={{
          display: 'flex', gap: 8, padding: '10px 12px',
          paddingBottom: 'max(12px, calc(env(safe-area-inset-bottom, 0px) + 10px))',
          borderTop: '1px solid var(--line)', background: 'var(--bg)',
        }}
      >
        <input
          ref={inputRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(e) }}
          placeholder="Mensagem…"
          style={{
            flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)',
            borderRadius: 24, padding: '10px 16px',
            fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: content.trim() ? 'var(--accent)' : 'var(--surface-3)',
            color: content.trim() ? '#fff' : 'var(--ink-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
