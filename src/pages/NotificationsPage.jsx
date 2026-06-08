import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { formatRelativeTime } from '../utils/helpers'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications')
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  async function markAllRead() {
    await api.post('/notifications/read-all', {})
    setItems(current => current.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
  }

  function openNotification(item) {
    if (item.postId) navigate(`/articles/${item.postId}`)
    else if (item.actor?.id) navigate(`/profiles/${item.actor.id}`)
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Atividade</p>
          <h1 className="font-bold text-2xl text-dark-text mt-1">Notificações</h1>
        </div>
        {items.some(item => !item.readAt) && (
          <button onClick={markAllRead} className="text-xs text-dark-muted hover:text-dark-text">Marcar lidas</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-dark-muted text-sm">Nenhuma notificação ainda.</div>
      ) : (
        <div className="divide-y divide-dark-border/60">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => openNotification(item)}
              className="w-full text-left px-4 py-4 hover:bg-dark-hover/40 transition-colors"
            >
              <div className="flex gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${item.readAt ? 'bg-dark-border' : 'bg-brand-rose'}`} />
                <div className="min-w-0">
                  <p className="text-dark-text text-sm leading-relaxed">{item.message}</p>
                  <p className="text-dark-muted text-xs mt-1">{formatRelativeTime(item.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
