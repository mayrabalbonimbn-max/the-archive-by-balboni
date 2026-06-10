import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFriends } from '../hooks/useFriends'
import { useFollows } from '../hooks/useFollows'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import PersonRow from '../components/ui/PersonRow'

export default function FriendsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const viewId = searchParams.get('view')
  const initialTab = searchParams.get('tab') ?? 'circle'

  const friendsApi = useFriends()
  const followsApi = useFollows()
  const [tab, setTab] = useState(initialTab)

  // For viewing another user's circle
  const [viewProfile, setViewProfile] = useState(null)
  const [viewFollowing, setViewFollowing] = useState(null)
  const [viewFollowers, setViewFollowers] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  useEffect(() => {
    if (!viewId) return
    setViewLoading(true)
    Promise.all([
      api.get(`/profiles/${viewId}`),
      api.get(`/profiles/${viewId}/following`),
      api.get(`/profiles/${viewId}/followers`),
    ]).then(([prof, following, followers]) => {
      setViewProfile(prof)
      setViewFollowing(following)
      setViewFollowers(followers)
    }).catch(() => {}).finally(() => setViewLoading(false))
  }, [viewId])

  const isViewing = Boolean(viewId)
  const loading = isViewing ? viewLoading : (friendsApi.loading || followsApi.loading)

  const circle = isViewing ? (viewFollowing ?? []) : (followsApi.following ?? [])
  const followers = isViewing ? (viewFollowers ?? []) : (followsApi.followers ?? [])

  const tabs = [
    { id: 'circle',    label: `Círculo · ${circle.length}` },
    { id: 'followers', label: `Seguidores · ${followers.length}` },
  ]

  const list = tab === 'circle' ? circle : followers

  const title = isViewing
    ? (viewProfile ? `${viewProfile.name}` : 'Círculo')
    : 'Pessoas'

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
        title={title}
      />

      {/* Header */}
      <div style={{ padding: '18px 20px 6px' }}>
        <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--serif)', fontSize: 25, color: 'var(--ink)', fontWeight: 400 }}>
          {isViewing
            ? <>{viewProfile?.name ?? '…'} e seu <span style={{ fontStyle: 'italic' }}>círculo</span></>
            : <>Seu <span style={{ fontStyle: 'italic' }}>círculo</span></>
          }
        </h2>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
          {isViewing
            ? `${circle.length} pessoas que ${viewProfile?.name ?? 'este perfil'} acompanha.`
            : `${circle.length} pessoas que você acompanha. Sem contadores, sem exibição — só companhia.`
          }
        </div>
      </div>

      {/* Segmented tabs */}
      <div style={{ display: 'flex', gap: 22, padding: '14px 20px 0', borderBottom: '1px solid var(--line)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 0 12px', position: 'relative',
              fontFamily: 'var(--sans)', fontSize: 14,
              fontWeight: tab === t.id ? 600 : 500,
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
            }}
          >
            {t.label}
            {tab === t.id && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--accent)', borderRadius: 2 }} />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p style={{ padding: '40px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
          {tab === 'circle'
            ? (isViewing ? 'Este perfil ainda não acompanha ninguém.' : 'Você ainda não acompanha ninguém.')
            : (isViewing ? 'Nenhum seguidor ainda.' : 'Nenhum seguidor ainda.')
          }
        </p>
      ) : (
        <div>
          {list.map(person => (
            <PersonRow key={person.id} person={person} />
          ))}
        </div>
      )}

      {/* Footer */}
      {!isViewing && (
        <div style={{ padding: '26px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-3)' }}>
          Encontre pessoas pelo Explorar.
        </div>
      )}
    </div>
  )
}
