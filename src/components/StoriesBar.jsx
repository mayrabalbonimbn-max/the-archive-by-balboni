import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../utils/api'
import { useAvatarUrl } from '../hooks/useAvatarUrl'
import Avatar from './ui/Avatar'

// ── Media fetch ────────────────────────────────────────────────────────────────

async function fetchStoryBlob(id) {
  const token = localStorage.getItem('ms_token') ?? ''
  const BASE = import.meta.env.VITE_API_URL || '/api'
  const res = await fetch(`${BASE}/stories/${id}/media`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return null
  return URL.createObjectURL(await res.blob())
}

// ── Text story background presets ──────────────────────────────────────────────

const BG_PRESETS = [
  { color: '#0a0a0a', label: 'Preto' },
  { color: '#0f0f1a', label: 'Noite' },
  { color: '#1a0a2e', label: 'Roxo' },
  { color: '#0a1a2e', label: 'Azul' },
  { color: '#0a2e1a', label: 'Verde' },
  { color: '#2e1a0a', label: 'Âmbar' },
  { color: '#2e0a0a', label: 'Vinho' },
  { color: '#1a1a1a', label: 'Chumbo' },
]

const FONT_OPTS = [
  { key: 'serif',  label: 'Serif',  style: { fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 26 } },
  { key: 'sans',   label: 'Sans',   style: { fontFamily: 'var(--sans)',  fontWeight: 600,      fontSize: 24 } },
  { key: 'mono',   label: 'Mono',   style: { fontFamily: 'var(--mono)',  fontSize: 18, letterSpacing: '-0.02em' } },
]

function textStyle(fontKey, size = 26) {
  const f = FONT_OPTS.find(o => o.key === fontKey) || FONT_OPTS[0]
  return { ...f.style, fontSize: size }
}

// ── StoryViewer ────────────────────────────────────────────────────────────────

function StoryViewer({ groups, groupIndex: initGroup, storyIndex: initStory, onClose, onDeleted }) {
  const [gIdx, setGIdx] = useState(initGroup)
  const [sIdx, setSIdx] = useState(initStory)
  const [progress, setProgress] = useState(0)
  const [blobUrl, setBlobUrl] = useState(null)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const DURATION = 5000

  const group = groups[gIdx]
  const story = group?.items[sIdx]

  // Mark viewed
  useEffect(() => {
    if (story?.id && !story.viewed) {
      api.post(`/stories/${story.id}/view`, {}).catch(() => {})
      story.viewed = true
    }
  }, [story?.id])

  // Load blob for photo stories
  useEffect(() => {
    setBlobUrl(null)
    if (!story || story.type !== 'photo') return
    let alive = true
    if (story._blobUrl) { setBlobUrl(story._blobUrl); return }
    fetchStoryBlob(story.id).then(url => {
      if (alive && url) { story._blobUrl = url; setBlobUrl(url) }
    })
    return () => { alive = false }
  }, [story?.id])

  // Progress timer
  useEffect(() => {
    if (!story) return
    if (story.type === 'photo' && !blobUrl) return // wait for image
    setProgress(0)
    if (paused) return
    const start = Date.now()
    timerRef.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / DURATION, 1)
      setProgress(p)
      if (p >= 1) { clearInterval(timerRef.current); advance() }
    }, 40)
    return () => clearInterval(timerRef.current)
  }, [story?.id, blobUrl, paused])

  function advance() {
    if (sIdx < group.items.length - 1) { setSIdx(i => i + 1); setProgress(0) }
    else if (gIdx < groups.length - 1) { setGIdx(i => i + 1); setSIdx(0); setProgress(0) }
    else onClose()
  }

  function goBack() {
    if (sIdx > 0) { setSIdx(i => i - 1); setProgress(0) }
    else if (gIdx > 0) { setGIdx(i => i - 1); setSIdx(0); setProgress(0) }
  }

  async function deleteStory() {
    if (!story) return
    try {
      await api.delete(`/stories/${story.id}`)
      onDeleted(story.id)
      advance()
    } catch {}
  }

  if (!story) return null

  const isText = story.type === 'text'

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
      {/* Background for text stories */}
      {isText && (
        <div style={{ position: 'absolute', inset: 0, background: story.bgColor || '#0a0a0a' }} />
      )}

      {/* Progress bars */}
      <div style={{
        position: 'absolute',
        top: 'max(14px, calc(env(safe-area-inset-top, 0px) + 8px))',
        left: 12, right: 12, zIndex: 4,
        display: 'flex', gap: 3,
      }}>
        {group.items.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.28)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#fff', borderRadius: 2,
              width: i < sIdx ? '100%' : i === sIdx ? `${progress * 100}%` : '0%',
              transition: i === sIdx ? 'none' : undefined,
            }} />
          </div>
        ))}
      </div>

      {/* Author bar */}
      <div style={{
        position: 'absolute',
        top: 'max(30px, calc(env(safe-area-inset-top, 0px) + 20px))',
        left: 14, right: 14, zIndex: 4,
        display: 'flex', alignItems: 'center', gap: 10,
        paddingTop: 8,
      }}>
        <Avatar name={story.authorName} src={story._avatarUrl} profileId={story.profileId} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {story.authorName}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
            {timeAgo(story.createdAt)}
          </div>
        </div>
        {story.mine && (
          <button
            onClick={deleteStory}
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 11px', color: '#fff', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10 }}
          >
            Apagar
          </button>
        )}
        <button
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.4)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: '32px', textAlign: 'center', padding: 0 }}
        >
          ×
        </button>
      </div>

      {/* Story content */}
      {isText ? (
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '100px 32px 80px' }}>
          <p style={{ ...textStyle(story.fontStyle), color: '#fff', textAlign: 'center', margin: 0, lineHeight: 1.45, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            {story.content}
          </p>
        </div>
      ) : (
        blobUrl
          ? <img src={blobUrl} alt="" style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', objectFit: 'contain' }} />
          : <div style={{ position: 'relative', zIndex: 2, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--sans)', fontSize: 13 }}>Carregando…</div>
      )}

      {/* Tap zones */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 3 }}>
        <div style={{ flex: 1 }} onClick={goBack} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} />
        <div style={{ flex: 1 }} onClick={advance} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} />
      </div>
    </div>,
    document.body
  )
}

// ── StoryComposer ──────────────────────────────────────────────────────────────

function StoryComposer({ profile, onCreated, onClose }) {
  const [tab, setTab] = useState('text') // 'text' | 'photo'
  const [content, setContent] = useState('')
  const [bgColor, setBgColor] = useState(BG_PRESETS[0].color)
  const [fontKey, setFontKey] = useState('serif')
  const [visibility, setVisibility] = useState('friends')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setTab('photo')
  }

  async function submit() {
    setError(null)
    setSaving(true)
    try {
      let story
      if (tab === 'photo' && file) {
        const form = new FormData()
        form.append('file', file)
        form.append('visibility', visibility)
        story = await api.upload('/stories', form)
      } else {
        if (!content.trim()) { setError('Escreva algo.'); setSaving(false); return }
        story = await api.post('/stories', { type: 'text', content: content.trim(), bgColor, fontStyle: fontKey, visibility })
      }
      onCreated(story)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao publicar.')
    } finally {
      setSaving(false)
    }
  }

  const visLabels = { friends: 'Amigos', public: 'Público', private: 'Só eu' }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', touchAction: 'none' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, padding: '24px 20px max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))', overflowY: 'auto', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', flex: 1 }}>Novo Story</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--ink-3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--surface-2)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {[['text', 'Texto'], ['photo', 'Foto']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all .15s', background: tab === key ? 'var(--bg)' : 'transparent', color: tab === key ? 'var(--ink)' : 'var(--ink-3)', boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}
            >
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Text story composer */}
        {tab === 'text' && (
          <>
            {/* Preview */}
            <div style={{ borderRadius: 12, background: bgColor, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, padding: '16px 24px', position: 'relative', overflow: 'hidden' }}>
              {content
                ? <p style={{ ...textStyle(fontKey, 20), color: '#fff', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>{content}</p>
                : <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Prévia do texto</span>
              }
            </div>

            {/* Text input */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="O que você quer registrar hoje?"
              maxLength={280}
              rows={3}
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
            />

            {/* Font selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {FONT_OPTS.map(o => (
                <button key={o.key} onClick={() => setFontKey(o.key)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${fontKey === o.key ? 'var(--accent)' : 'var(--line)'}`, background: fontKey === o.key ? 'var(--surface-2)' : 'none', cursor: 'pointer', ...o.style, fontSize: 13, color: fontKey === o.key ? 'var(--accent)' : 'var(--ink-3)' }}>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Background color */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {BG_PRESETS.map(p => (
                <button
                  key={p.color}
                  onClick={() => setBgColor(p.color)}
                  title={p.label}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: p.color, border: bgColor === p.color ? '2.5px solid var(--accent)' : '2px solid var(--line-strong)', cursor: 'pointer', padding: 0 }}
                />
              ))}
            </div>
          </>
        )}

        {/* Photo story composer */}
        {tab === 'photo' && (
          <div style={{ marginBottom: 18 }}>
            {preview ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 240, marginBottom: 12 }}>
                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => { setFile(null); setPreview(null) }}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{ width: '100%', height: 180, borderRadius: 12, border: '2px dashed var(--line-strong)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>Escolher foto</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        )}

        {/* Visibility */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {Object.entries(visLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setVisibility(key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${visibility === key ? 'var(--accent)' : 'var(--line)'}`, background: visibility === key ? 'rgba(var(--accent-rgb, 180,120,80), 0.08)' : 'none', fontFamily: 'var(--sans)', fontSize: 12, cursor: 'pointer', color: visibility === key ? 'var(--accent)' : 'var(--ink-3)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--error, #f85149)', marginBottom: 10 }}>{error}</p>}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={saving}
          style={{ width: '100%', padding: '14px 0', borderRadius: 99, background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Publicando…' : 'Publicar Story'}
        </button>
      </div>
    </div>,
    document.body
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (h >= 1) return `há ${h}h`
  if (m >= 1) return `há ${m}min`
  return 'agora'
}

// ── StoryRing ──────────────────────────────────────────────────────────────────

function StoryRing({ label, name, avatarSrc, profileId, onClick, isAdd, uploading, hasUnread }) {
  const resolvedAvatarSrc = useAvatarUrl(profileId, avatarSrc)

  const ringBg = isAdd
    ? 'none'
    : hasUnread
      ? 'linear-gradient(135deg, var(--accent) 0%, #c77dff 100%)'
      : 'var(--line-strong)'

  return (
    <button
      onClick={onClick}
      disabled={uploading}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: uploading ? 'default' : 'pointer', padding: '2px 2px', flexShrink: 0, opacity: uploading ? 0.5 : 1, touchAction: 'manipulation' }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: isAdd ? 'var(--surface-2)' : ringBg,
        border: isAdd ? '2px dashed var(--line-strong)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isAdd ? 0 : 2.5,
      }}>
        {isAdd
          ? uploading
            ? <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
          : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar name={name} src={resolvedAvatarSrc} size={50} />
            </div>
        }
      </div>
      <span style={{ fontFamily: 'var(--sans)', fontSize: 10.5, color: 'var(--ink-3)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}

// ── StoriesBar ─────────────────────────────────────────────────────────────────

export default function StoriesBar({ profile }) {
  const [stories, setStories] = useState([])
  const [viewing, setViewing] = useState(null) // { groups, groupIndex, storyIndex }
  const [composing, setComposing] = useState(false)

  async function load() {
    try {
      const data = await api.get('/stories')
      setStories(data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  // Group by author (own first)
  const groups = []
  const seen = new Map()
  const sorted = [...stories].sort((a, b) => {
    if (a.mine && !b.mine) return -1
    if (!a.mine && b.mine) return 1
    return 0
  })
  sorted.forEach(s => {
    if (!seen.has(s.profileId)) {
      seen.set(s.profileId, groups.length)
      groups.push({
        profileId: s.profileId,
        name: s.authorName,
        avatarRaw: s.authorAvatarRaw,
        mine: s.mine,
        items: [],
      })
    }
    groups[seen.get(s.profileId)].items.push(s)
  })

  function handleCreated(story) {
    setStories(prev => [story, ...prev.filter(s => !(s.mine && s.id === story.id))])
  }

  function openGroup(group) {
    const gIdx = groups.indexOf(group)
    setViewing({ groups, groupIndex: gIdx, storyIndex: 0 })
  }

  function handleDeleted(id) {
    setStories(prev => prev.filter(s => s.id !== id))
    setViewing(null)
  }

  const ownGroup = groups.find(g => g.mine)
  const others = groups.filter(g => !g.mine)
  const hasAny = groups.length > 0

  if (!hasAny && false) return null // always show bar for + button

  return (
    <>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 14px 12px', borderBottom: '1px solid var(--line)', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {/* Add / own story */}
        {ownGroup ? (
          <StoryRing
            label="Você"
            name={profile?.name}
            avatarSrc={profile?.avatar}
            profileId={profile?.id}
            hasUnread={ownGroup.items.some(s => !s.viewed)}
            onClick={() => openGroup(ownGroup)}
          />
        ) : (
          <StoryRing
            label="Adicionar"
            isAdd
            onClick={() => setComposing(true)}
          />
        )}

        {/* If user has own stories, also show + */}
        {ownGroup && (
          <StoryRing
            label="Novo"
            isAdd
            onClick={() => setComposing(true)}
          />
        )}

        {/* Other authors */}
        {others.map(group => (
          <StoryRing
            key={group.profileId}
            label={group.name}
            name={group.name}
            avatarSrc={group.avatarRaw}
            profileId={group.profileId}
            hasUnread={group.items.some(s => !s.viewed)}
            onClick={() => openGroup(group)}
          />
        ))}
      </div>

      {composing && (
        <StoryComposer
          profile={profile}
          onCreated={handleCreated}
          onClose={() => setComposing(false)}
        />
      )}

      {viewing && (
        <StoryViewer
          groups={viewing.groups}
          groupIndex={viewing.groupIndex}
          storyIndex={viewing.storyIndex}
          onClose={() => setViewing(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
