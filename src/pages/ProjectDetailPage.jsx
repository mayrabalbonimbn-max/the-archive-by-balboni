import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

const STATUS_LABELS = {
  ideia: { label: 'Ideia', color: '#6b7280' },
  construindo: { label: 'Construindo', color: '#f59e0b' },
  ativo: { label: 'Ativo', color: '#10b981' },
  pausado: { label: 'Pausado', color: '#6b7280' },
  concluído: { label: 'Concluído', color: '#8b5cf6' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function PostItem({ post }) {
  const navigate = useNavigate()
  const icon = post.isArticle ? 'feather' : post.codeLanguage ? 'code' : 'note'
  return (
    <div
      onClick={() => navigate(post.isArticle ? `/articles/${post.id}` : `/posts/${post.id}`)}
      style={{
        padding: '14px 0', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      <div style={{ color: 'var(--ink-3)', marginTop: 2 }}>
        <Icon name={icon} size={16} stroke={1.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 3 }}>
          {post.articleTitle || post.content?.slice(0, 80) || 'Sem conteúdo'}
          {!post.articleTitle && post.content?.length > 80 && '…'}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
          {formatDate(post.createdAt)}
          {post.codeLanguage && ` · ${post.codeLanguage}`}
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${slug}`),
      api.get(`/projects/${slug}/posts`),
    ])
      .then(([proj, projectPosts]) => {
        setProject(proj)
        setEditForm(proj)
        setPosts(projectPosts)
      })
      .catch(() => navigate('/profile'))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const updated = await api.patch(`/projects/${slug}`, {
        title: editForm.title,
        emoji: editForm.emoji,
        description: editForm.description,
        status: editForm.status,
        githubUrl: editForm.githubUrl,
        websiteUrl: editForm.websiteUrl,
        isFeatured: editForm.isFeatured,
      })
      setProject(updated)
      setEditing(false)
      if (updated.slug !== slug) navigate(`/projects/${updated.slug}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Apagar este projeto? Esta ação é irreversível.')) return
    try {
      await api.delete(`/projects/${slug}`)
      navigate('/profile')
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!project) return null

  const status = STATUS_LABELS[project.status] || STATUS_LABELS.ativo

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)', minHeight: '100vh' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}>
            <Icon name="back" size={22} />
          </button>
        }
        right={
          <button
            onClick={() => setEditing(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="more" size={19} />
          </button>
        }
      />

      {/* Hero */}
      <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <span style={{ fontSize: 48, lineHeight: 1 }}>{project.emoji}</span>
          <div>
            <h1 style={{ margin: '0 0 6px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {project.title}
            </h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>{status.label.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {project.description && (
          <p style={{ margin: '0 0 18px', fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: 560 }}>
            {project.description}
          </p>
        )}

        {/* Links */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)',
              fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', textDecoration: 'none',
            }}>
              <Icon name="code" size={14} stroke={1.5} /> GitHub
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)',
              fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', textDecoration: 'none',
            }}>
              <Icon name="explore" size={14} stroke={1.5} /> Site
            </a>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '24px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 16 }}>
          TIMELINE — {posts.length} {posts.length === 1 ? 'entrada' : 'entradas'}
        </div>

        {posts.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
            Nenhuma entrada associada a este projeto ainda. Ao criar um post, selecione este projeto para que ele apareça aqui.
          </p>
        ) : (
          <div>{posts.map(p => <PostItem key={p.id} post={p} />)}</div>
        )}
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', border: '1px solid var(--line)', width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto', padding: '24px 24px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)' }}>Editar Projeto</span>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 20 }}>✕</button>
            </div>

            {[
              { key: 'emoji', label: 'Emoji', type: 'text', placeholder: '🌱' },
              { key: 'title', label: 'Nome', type: 'text', placeholder: 'Nome do projeto' },
              { key: 'description', label: 'Descrição', type: 'textarea', placeholder: 'O que é este projeto?' },
              { key: 'githubUrl', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/...' },
              { key: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'https://...' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 6 }}>
                  {field.label.toUpperCase()}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={editForm[field.key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={editForm[field.key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}

            {/* Status */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 6 }}>STATUS</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setEditForm(f => ({ ...f, status: key }))}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: `1px solid ${editForm.status === key ? 'var(--accent)' : 'var(--line)'}`,
                      background: editForm.status === key ? 'rgba(232,108,180,0.1)' : 'var(--surface-2)',
                      cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5,
                      color: editForm.status === key ? 'var(--accent)' : 'var(--ink-3)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={editForm.isFeatured || false}
                onChange={e => setEditForm(f => ({ ...f, isFeatured: e.target.checked }))}
              />
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)' }}>Destacar no perfil</span>
            </label>

            {error && <p style={{ color: '#f87171', fontFamily: 'var(--sans)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: 'var(--accent)', cursor: saving ? 'default' : 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: '#fff',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--sans)', fontSize: 13, color: '#f87171',
                }}
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
