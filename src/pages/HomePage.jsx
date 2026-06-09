import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import PhotoTile from '../components/ui/PhotoTile'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import { api } from '../utils/api'

// ── Masthead ──────────────────────────────────────────────────────────────────
function Masthead({ profile, posts }) {
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = (profile.name ?? '').split(' ')[0]

  const dateLine = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase()

  const daysKept = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000))
    : null
  const entriesKept = posts.length

  return (
    <div style={{ padding: '22px 20px 18px' }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em',
        color: 'var(--accent)', marginBottom: 14,
      }}>
        {dateLine}
      </div>
      <h1 style={{
        margin: 0,
        fontFamily: 'var(--serif)', fontSize: 33, lineHeight: 1.08,
        color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em',
      }}>
        {greet},<br />
        <span style={{ fontStyle: 'italic' }}>{firstName}.</span>
      </h1>
      <div style={{ marginTop: 14, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)' }}>
        {daysKept && <>Dia <span style={{ color: 'var(--ink-2)' }}>{daysKept.toLocaleString('pt-BR')}</span> do seu arquivo · </>}
        <span style={{ color: 'var(--ink-2)' }}>{entriesKept.toLocaleString('pt-BR')}</span> entradas guardadas
      </div>
    </div>
  )
}

// ── TodayPrompt ───────────────────────────────────────────────────────────────
function TodayPrompt() {
  function openCompose() {
    window.dispatchEvent(new CustomEvent('open-compose'))
  }
  return (
    <button
      onClick={openCompose}
      style={{
        margin: '0 20px 26px',
        width: 'calc(100% - 40px)',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '15px 17px',
        borderRadius: 16,
        border: '1px solid var(--line-strong)',
        background: 'rgba(232,108,180,0.06)',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--accent)', color: '#fff',
      }}>
        <Icon name="feather" size={20} stroke={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 16.5, color: 'var(--ink)', fontStyle: 'italic' }}>
          O que você está guardando hoje?
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
          Uma nota, uma foto, um arquivo — no seu arquivo
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <Icon name="plus" size={20} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
    </button>
  )
}

// ── Memory strip ──────────────────────────────────────────────────────────────
function MemoryStrip({ memories, onSeeAll }) {
  const navigate = useNavigate()
  if (!memories.length) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel action="Ver tudo" onAction={onSeeAll ?? (() => navigate('/memories'))}>
        Neste dia
      </SectionLabel>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
        {memories.map(m => (
          <div
            key={m.id}
            onClick={() => navigate('/memories')}
            style={{ flexShrink: 0, width: 168, cursor: 'pointer' }}
          >
            {m.type === 'photo' || m.photo ? (
              <PhotoTile
                tone1={m.tone1 ?? '#2a3140'}
                tone2={m.tone2 ?? '#11141c'}
                radius={14}
                style={{ height: 116 }}
              >
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', padding: 12,
                  background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.55))',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)' }}>
                    {m.yearsAgo ?? m.label}
                  </div>
                </div>
              </PhotoTile>
            ) : (
              <div style={{
                height: 116, borderRadius: 14,
                border: '1px solid var(--line-strong)',
                background: 'rgba(255,255,255,0.02)',
                padding: 13,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)' }}>
                  {m.label ?? (m.yearsAgo ? `${m.yearsAgo} ${m.yearsAgo === 1 ? 'ANO' : 'ANOS'} ATRÁS` : 'MEMÓRIA')}
                </div>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.35,
                  color: 'var(--ink-2)', fontStyle: 'italic',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {m.articleTitle ?? m.body ?? m.content}
                </div>
              </div>
            )}
            <div style={{ marginTop: 8, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {m.articleTitle ?? m.content ?? m.title}
            </div>
            {m.year && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{m.year}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── NotifBell ─────────────────────────────────────────────────────────────────
function NotifBell({ hasUnread, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', width: 38, height: 38, borderRadius: '50%',
        border: 'none', cursor: 'pointer',
        background: 'var(--surface-3)', color: 'var(--ink-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon name="bell" size={19} />
      {hasUnread && (
        <span style={{
          position: 'absolute', top: 8, right: 9, width: 7, height: 7,
          borderRadius: '50%', background: 'var(--accent)',
          border: '1.5px solid #000',
        }} />
      )}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage({ posts, profile, searchQuery, onPost, onLike, onSave, onPin, onDelete }) {
  const navigate = useNavigate()
  const [circlePosts, setCirclePosts] = useState([])
  const [circleLoading, setCircleLoading] = useState(true)
  const [memories, setMemories] = useState([])

  useEffect(() => {
    api.get('/archive/memories').then(d => setMemories(d.slice(0, 4))).catch(() => {})
    api.get('/posts/following')
      .then(d => setCirclePosts(d.slice(0, 6)))
      .catch(() => {})
      .finally(() => setCircleLoading(false))
  }, [])

  async function updateCirclePost(id, action, reactionType) {
    const updated = await api.patch(`/posts/${id}`, reactionType ? { action, reactionType } : { action })
    setCirclePosts(cur => cur.map(p => p.id === id ? { ...updated, attachments: p.attachments, author: p.author } : p))
  }

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      {/* Mobile AppBar */}
      <AppBar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              The Archive
            </span>
          </div>
        }
        right={
          <>
            <NotifBell hasUnread onClick={() => navigate('/notifications')} />
            <button
              onClick={() => navigate('/explore')}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'var(--surface-3)', color: 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="search" size={19} />
            </button>
          </>
        }
      />

      {/* Masthead */}
      <Masthead profile={profile} posts={posts} />

      {/* TodayPrompt */}
      <TodayPrompt />

      {/* Memory strip */}
      <MemoryStrip memories={memories} />

      {/* Circle feed */}
      <SectionLabel>Do seu círculo hoje</SectionLabel>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {circleLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : circlePosts.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              Nenhuma entrada do seu círculo ainda.
            </p>
            <button
              onClick={() => navigate('/friends')}
              style={{ marginTop: 10, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Encontrar pessoas →
            </button>
          </div>
        ) : (
          circlePosts.map(p => (
            <EntryCard
              key={p.id}
              post={p}
              showAuthor
              onLike={() => updateCirclePost(p.id, 'react', 'heart')}
              onSave={() => updateCirclePost(p.id, 'save')}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '26px 20px 8px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-3)' }}>
          É isso, hoje.
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
          Volte amanhã, ou guarde algo agora.
        </div>
      </div>
    </div>
  )
}
