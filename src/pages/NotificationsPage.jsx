import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import PhotoTile from '../components/ui/PhotoTile'

function relTime(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function groupItems(items) {
  const now = Date.now()
  const groups = { 'Hoje': [], 'Esta semana': [], 'Antes': [] }
  for (const item of items) {
    const diff = (now - new Date(item.createdAt)) / 1000
    if (diff < 86400) groups['Hoje'].push(item)
    else if (diff < 604800) groups['Esta semana'].push(item)
    else groups['Antes'].push(item)
  }
  return groups
}

const TYPE_VERB = {
  react:   'apreciou sua entrada',
  like:    'apreciou sua entrada',
  comment: 'deixou uma nota em',
  collect: 'guardou sua entrada em',
  follow:  'adicionou você ao círculo',
  mention: 'mencionou você em',
}

const TYPE_ICON = {
  react: 'heart', like: 'heart',
  comment: 'comment',
  collect: 'collections',
  follow: 'people',
  mention: 'tag',
}

function NoticeRow({ item, onFollowBack }) {
  const navigate = useNavigate()
  const isMemory = item.type === 'memory'
  const unread = !item.readAt
  const actorName = item.actor?.name ?? 'Alguém'
  const verb = TYPE_VERB[item.type] ?? item.message ?? ''
  const target = item.postTitle ?? item.collectionName ?? item.target ?? ''
  const iconName = TYPE_ICON[item.type]

  function open() {
    if (isMemory) navigate('/memories')
    else if (item.type === 'comment' && item.postId) navigate(`/posts/${item.postId}?comment=${item.commentId ?? ''}`)
    else if (item.type === 'reply' && item.postId) navigate(`/posts/${item.postId}?comment=${item.commentId ?? ''}`)
    else if (item.postId) navigate(`/posts/${item.postId}`)
    else if (item.actor?.id) navigate(item.actor.handle ? `/@${item.actor.handle}` : `/profiles/${item.actor.id}`)
  }

  if (isMemory) {
    return (
      <div
        onClick={open}
        style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
      >
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232,108,180,0.12)', color: 'var(--accent)' }}>
          <Icon name="sparkle" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink)' }}>{item.title ?? 'Memória do arquivo'}</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{item.message ?? 'Neste dia, em outro ano'}</div>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>{relTime(item.createdAt)}</span>
      </div>
    )
  }

  return (
    <div
      onClick={open}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer', position: 'relative' }}
    >
      {unread && (
        <div style={{ position: 'absolute', left: 8, top: 24, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
      )}

      {/* Avatar + badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={actorName} src={item.actor?.avatar} profileId={item.actor?.id} size={40} />
        {iconName && (
          <div style={{
            position: 'absolute', right: -2, bottom: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <Icon name={iconName} size={11} fill={item.type === 'react' || item.type === 'like'} stroke={2} />
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{actorName}</span>{' '}
          {verb}
          {target && item.type !== 'follow' && (
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink)' }}> {target}</span>
          )}
          {'.'}
        </div>

        {item.quote && (
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.5,
            color: 'var(--ink-3)', marginTop: 6, paddingLeft: 11,
            borderLeft: '1px solid var(--line-strong)',
          }}>
            {item.quote}
          </div>
        )}

        {item.type === 'follow' && (
          <button
            onClick={e => { e.stopPropagation(); onFollowBack?.(item.actor?.id) }}
            style={{
              marginTop: 9, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600,
              border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)',
            }}
          >
            Seguir de volta
          </button>
        )}
      </div>

      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>
        {relTime(item.createdAt)}
      </span>
    </div>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function markAllRead() {
    await api.post('/notifications/read-all', {}).catch(() => {})
    setItems(cur => cur.map(i => ({ ...i, readAt: i.readAt || new Date().toISOString() })))
  }

  async function followBack(actorId) {
    if (!actorId) return
    await api.post(`/follows/${actorId}`, {}).catch(() => {})
  }

  const hasUnread = items.some(i => !i.readAt)
  const groups = groupItems(items)

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="back" size={22} />
          </button>
        }
        title="Avisos"
        right={
          hasUnread ? (
            <button
              onClick={markAllRead}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}
            >
              Marcar lidas
            </button>
          ) : null
        }
      />

      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
          Novidades do seu círculo. Tranquilo de propósito — sem contadores, sem ruído.
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
          Nenhum aviso ainda.
        </div>
      ) : (
        <>
          {Object.entries(groups).map(([label, groupItems]) => {
            if (!groupItems.length) return null
            return (
              <div key={label} style={{ marginTop: 14 }}>
                <div style={{ padding: '10px 20px 4px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ borderTop: '1px solid var(--line)' }}>
                  {groupItems.map(item => (
                    <NoticeRow key={item.id} item={item} onFollowBack={followBack} />
                  ))}
                </div>
              </div>
            )
          })}
          <div style={{ padding: '26px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-3)' }}>
            Você está em dia.
          </div>
        </>
      )}
    </div>
  )
}
