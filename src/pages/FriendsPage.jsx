import { useEffect, useState } from 'react'
import { useFriends } from '../hooks/useFriends'
import { useFollows } from '../hooks/useFollows'

function Avatar({ person }) {
  return (
    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-1 ring-dark-border/60">
      {person.avatar ? (
        <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold">
          {person.name?.[0] || '@'}
        </div>
      )}
    </div>
  )
}

function PersonRow({ person, action, meta }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dark-border bg-dark-card px-3 py-3">
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <p className="text-dark-text text-sm font-semibold truncate">{person.name}</p>
        <p className="text-dark-muted text-xs truncate">{person.handle}{meta ? ` · ${meta}` : ''}</p>
      </div>
      {action}
    </div>
  )
}

export default function FriendsPage() {
  const friendsApi = useFriends()
  const followsApi = useFollows()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const clean = query.trim()
    if (clean.length < 2) {
      setResults([])
      return
    }
    let active = true
    const t = setTimeout(() => {
      followsApi.searchPeople(clean).then(data => {
        if (active) setResults(data)
      }).catch(() => {
        if (active) setResults([])
      })
    }, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [query, followsApi.searchPeople])

  async function run(key, fn, clear = false) {
    setBusy(key)
    setError('')
    try {
      await fn()
      if (clear) {
        setQuery('')
        setResults([])
      } else if (query.trim().length >= 2) {
        setResults(await followsApi.searchPeople(query.trim()))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const loading = friendsApi.loading || followsApi.loading

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Arquivo conectado</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">Conexões</h1>
      </div>

      <section className="px-4 py-5 border-b border-dark-border/60">
        <label className="text-xs font-semibold text-dark-muted">Encontrar pessoas por @handle ou nome</label>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="@handle ou nome"
          className="input-dark text-sm py-2.5 mt-2"
        />
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map(person => (
              <PersonRow
                key={person.id}
                person={person}
                meta={`${person.followerCount || 0} seguidores`}
                action={
                  <div className="flex gap-2">
                    <button
                      onClick={() => run(`follow-${person.id}`, () => person.isFollowing ? followsApi.unfollow(person.id) : followsApi.follow(person.id))}
                      disabled={busy === `follow-${person.id}`}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border ${person.isFollowing ? 'border-dark-border text-dark-muted hover:text-red-400' : 'border-brand-rose bg-brand-rose text-white'}`}
                    >
                      {person.isFollowing ? 'Deixar' : 'Seguir'}
                    </button>
                    <button
                      onClick={() => run(`invite-${person.id}`, () => friendsApi.sendInvite(person), true)}
                      disabled={busy === `invite-${person.id}`}
                      className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-dark-muted hover:text-dark-text"
                    >
                      Convidar
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-5 space-y-7">
          <section>
            <h2 className="text-dark-text font-semibold mb-3">Seguindo</h2>
            {followsApi.following.length === 0 ? (
              <p className="text-dark-muted text-sm">Você ainda não está acompanhando ninguém.</p>
            ) : (
              <div className="space-y-2">
                {followsApi.following.map(person => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    action={<button onClick={() => run(`unfollow-${person.id}`, () => followsApi.unfollow(person.id))} className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-dark-muted hover:text-red-400">Deixar</button>}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-dark-text font-semibold mb-3">Seguidores</h2>
            {followsApi.followers.length === 0 ? (
              <p className="text-dark-muted text-sm">Nenhum seguidor ainda.</p>
            ) : (
              <div className="space-y-2">
                {followsApi.followers.map(person => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    action={person.isFollowing ? <span className="text-xs text-dark-muted">Você segue</span> : <button onClick={() => run(`followback-${person.id}`, () => followsApi.follow(person.id))} className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-dark-text hover:bg-dark-hover">Seguir</button>}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-dark-text font-semibold mb-3">Convites recebidos</h2>
            {friendsApi.incoming.length === 0 ? (
              <p className="text-dark-muted text-sm">Nenhum convite recebido.</p>
            ) : (
              <div className="space-y-2">
                {friendsApi.incoming.map(person => (
                  <PersonRow
                    key={person.friendshipId}
                    person={person}
                    action={
                      <div className="flex gap-2">
                        <button onClick={() => run(`accept-${person.friendshipId}`, () => friendsApi.respondInvite(person.friendshipId, 'accept'))} className="rounded-full bg-brand-rose px-3 py-1.5 text-xs font-semibold text-white">Aceitar</button>
                        <button onClick={() => run(`reject-${person.friendshipId}`, () => friendsApi.respondInvite(person.friendshipId, 'reject'))} className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-dark-muted hover:text-dark-text">Recusar</button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-dark-text font-semibold mb-3">Amigos</h2>
            {friendsApi.friends.length === 0 ? (
              <p className="text-dark-muted text-sm">Sua lista de amigos ainda está vazia.</p>
            ) : (
              <div className="space-y-2">
                {friendsApi.friends.map(person => (
                  <PersonRow key={person.id} person={person} action={<button onClick={() => run(`remove-${person.id}`, () => friendsApi.removeFriend(person.id))} className="rounded-full border border-dark-border px-3 py-1.5 text-xs text-dark-muted hover:text-red-400">Remover</button>} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
