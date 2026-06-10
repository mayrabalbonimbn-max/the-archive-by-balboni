import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'

function relTime(iso) {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [convs, setConvs] = useState(null)

  useEffect(() => {
    api.get('/conversations').then(setConvs).catch(() => setConvs([]))
  }, [])

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={<span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>Mensagens</span>}
      />

      {!convs ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : convs.length === 0 ? (
        <div style={{ padding: '64px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)' }}>
            Nenhuma mensagem ainda.
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>
            Visite um perfil e clique em Mensagem para iniciar uma conversa.
          </p>
        </div>
      ) : (
        <div>
          {convs.map(conv => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13,
                width: '100%', padding: '14px 20px',
                border: 'none', borderBottom: '1px solid var(--line)',
                background: conv.unread > 0 ? 'rgba(232,108,180,0.04)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Avatar name={conv.participant?.name} src={conv.participant?.avatar} profileId={conv.participant?.id} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: conv.unread > 0 ? 700 : 500, color: 'var(--ink)' }}>
                    {conv.participant?.name}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 'auto' }}>
                    {relTime(conv.lastMessage?.createdAt)}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: conv.unread > 0 ? 'var(--ink-2)' : 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage?.content ?? 'Iniciar conversa'}
                </p>
              </div>
              {conv.unread > 0 && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
