import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'article', label: 'Artigos' },
  { id: 'code', label: 'Programação' },
  { id: 'photo', label: 'Fotografia' },
  { id: 'personal', label: 'Pessoal' },
]

function categorize(post) {
  if (post.isArticle) return 'article'
  if (post.codeLanguage) return 'code'
  const tags = (post.content || '').match(/#[\p{L}\p{N}_-]+/gu) || []
  const tagNames = tags.map(t => t.slice(1).toLowerCase())
  if (tagNames.some(t => ['fotografia','foto','photography','câmera','camera'].includes(t))) return 'photo'
  if (tagNames.some(t => ['programação','código','dev','development','swift','javascript','python','css','html','react'].includes(t))) return 'code'
  if (tagNames.some(t => ['diário','pessoal','personal','vida','vida'].includes(t))) return 'personal'
  return 'personal'
}

function BookCard({ post, onClick }) {
  const cat = categorize(post)
  const catColors = { article: '#7AA2F7', code: '#E5C07B', photo: '#73DACA', personal: 'var(--ink-3)' }
  const catLabels = { article: 'Artigo', code: 'Código', photo: 'Fotografia', personal: 'Pessoal' }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12,
        padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: catColors[cat], textTransform: 'uppercase', letterSpacing: '0.08em' }}>{catLabels[cat]}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)' }}>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      {post.isArticle && post.articleTitle ? (
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)', lineHeight: 1.4 }}>{post.articleTitle}</div>
      ) : (
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
          {(post.content || '').slice(0, 100)}{post.content?.length > 100 ? '…' : ''}
        </div>
      )}
      {post.codeLanguage && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{post.codeLanguage}</div>
      )}
    </div>
  )
}

export default function KnowledgePage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/posts').then(data => {
      const arr = Array.isArray(data) ? data : (data?.posts || [])
      // filter to knowledge-relevant: articles or coded posts
      setPosts(arr)
    }).catch(() => {
      setError(true)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const cat = categorize(p)
      const matchCat = category === 'all' || cat === category
      const q = search.toLowerCase()
      const matchSearch = !q || (p.content || '').toLowerCase().includes(q) || (p.articleTitle || '').toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [posts, category, search])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={18} />
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Conhecimento</span>
        }
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 30, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Base de Conhecimento</h1>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px',
              background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10,
              fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', outline: 'none',
            }}
          />
          <Icon name="search" size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }} />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 24, paddingBottom: 2 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${category === c.id ? 'var(--accent)' : 'var(--line)'}`,
              background: category === c.id ? 'rgba(232,108,180,0.1)' : 'transparent',
              color: category === c.id ? 'var(--accent)' : 'var(--ink-3)',
              fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
            }}>{c.label}</button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>carregando…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>Não foi possível carregar.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Verifique sua conexão e tente novamente.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', marginBottom: 6 }}>Nenhum registro encontrado.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Tente outra categoria ou termo de busca.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(post => (
              <BookCard
                key={post.id}
                post={post}
                onClick={() => navigate(post.isArticle ? `/articles/${post.id}` : `/posts/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
