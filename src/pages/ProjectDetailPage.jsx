import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  ideia:      { label: 'Ideia',       color: '#6b7280' },
  construindo:{ label: 'Construindo', color: '#f59e0b' },
  ativo:      { label: 'Ativo',       color: '#10b981' },
  pausado:    { label: 'Pausado',     color: '#6b7280' },
  concluído:  { label: 'Concluído',   color: '#8b5cf6' },
}

const SUGGESTED_MILESTONES = ['Ideia inicial', 'Primeira versão', 'MVP', 'Lançamento', 'Conclusão']

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtShort(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function fmtAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`
  return `${Math.floor(days / 30)}m atrás`
}

function toInputDate(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHead({ label, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>
        {label}
      </span>
      {action && (
        <button onClick={onAction} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.06em' }}>
          {action}
        </button>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)',
  borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 13.5,
  color: 'var(--ink)', boxSizing: 'border-box', outline: 'none',
}

function PostItem({ post }) {
  const navigate = useNavigate()
  const icon = post.isArticle ? 'feather' : post.codeLanguage ? 'code' : post.photoCount > 0 ? 'photo' : 'note'
  return (
    <div
      onClick={() => navigate(post.isArticle ? `/articles/${post.id}` : `/posts/${post.id}`)}
      style={{ padding: '13px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <Icon name={icon} size={15} stroke={1.5} style={{ color: 'var(--ink-3)', marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.articleTitle || post.content?.slice(0, 90) || 'Sem conteúdo'}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
          {fmtDate(post.createdAt)}{post.codeLanguage ? ` · ${post.codeLanguage}` : ''}{post.photoCount > 0 ? ` · 📷 ${post.photoCount}` : ''}
        </div>
      </div>
    </div>
  )
}

// ─── Milestones section ───────────────────────────────────────────────────────

function MilestonesSection({ slug }) {
  const [milestones, setMilestones] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/projects/${slug}/milestones`).then(setMilestones).catch(() => setMilestones([]))
  }, [slug])

  async function addMilestone(title) {
    setSaving(true)
    try {
      const m = await api.post(`/projects/${slug}/milestones`, {
        title: title || newTitle,
        description: newDesc,
        reachedAt: newDate || null,
        sortOrder: (milestones?.length || 0),
      })
      setMilestones(prev => [...(prev || []), m])
      setAdding(false)
      setNewTitle(''); setNewDate(''); setNewDesc('')
    } catch {}
    setSaving(false)
  }

  async function deleteMilestone(id) {
    await api.delete(`/projects/${slug}/milestones/${id}`)
    setMilestones(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div style={{ padding: '28px 24px', borderTop: '1px solid var(--line)' }}>
      <SectionHead label="MARCOS" action="+ Adicionar" onAction={() => setAdding(a => !a)} />

      {/* Suggested quick-add */}
      {!adding && (!milestones || milestones.length === 0) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {SUGGESTED_MILESTONES.map(s => (
            <button
              key={s}
              onClick={() => { setNewTitle(s); setAdding(true) }}
              style={{
                padding: '5px 11px', borderRadius: 20,
                border: '1px dashed var(--line)', background: 'transparent',
                cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nome do marco"
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Notas sobre este marco (opcional)"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 7 }}>
            {/* Quick suggestions while adding */}
            {SUGGESTED_MILESTONES.map(s => (
              <button key={s} onClick={() => setNewTitle(s)}
                style={{ flexShrink: 0, padding: '3px 9px', borderRadius: 16, border: '1px solid var(--line)', background: newTitle === s ? 'rgba(232,108,180,0.1)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, color: newTitle === s ? 'var(--accent)' : 'var(--ink-3)' }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
            <button onClick={() => addMilestone()} disabled={saving || !newTitle.trim()}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, opacity: saving || !newTitle.trim() ? 0.6 : 1 }}>
              {saving ? 'Salvando…' : 'Adicionar'}
            </button>
            <button onClick={() => setAdding(false)}
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {milestones === null ? (
        <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" style={{ margin: '12px 0' }} />
      ) : milestones.length === 0 && !adding ? (
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-3)' }}>
          Registre os momentos importantes deste projeto.
        </p>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {/* vertical line */}
          <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 1, background: 'var(--line)' }} />
          {milestones.map(m => (
            <div key={m.id} style={{ position: 'relative', paddingBottom: 20 }}>
              <div style={{ position: 'absolute', left: -14, top: 4, width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: m.reachedAt ? 2 : 0 }}>
                    {m.title}
                  </div>
                  {m.reachedAt && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                      {fmtDate(m.reachedAt)}
                    </div>
                  )}
                  {m.description && (
                    <p style={{ margin: '4px 0 0', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                      {m.description}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteMilestone(m.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 14, flexShrink: 0, padding: '2px 4px', opacity: 0.6 }}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Learnings section ────────────────────────────────────────────────────────

function LearningsSection({ slug }) {
  const [learnings, setLearnings] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const textRef = useRef(null)

  useEffect(() => {
    api.get(`/projects/${slug}/learnings`).then(setLearnings).catch(() => setLearnings([]))
  }, [slug])

  useEffect(() => { if (adding && textRef.current) textRef.current.focus() }, [adding])

  async function add() {
    if (!newContent.trim()) return
    setSaving(true)
    try {
      const l = await api.post(`/projects/${slug}/learnings`, { content: newContent })
      setLearnings(prev => [l, ...(prev || [])])
      setNewContent('')
      setAdding(false)
    } catch {}
    setSaving(false)
  }

  async function update(id) {
    try {
      const l = await api.patch(`/projects/${slug}/learnings/${id}`, { content: editContent })
      setLearnings(prev => prev.map(x => x.id === id ? l : x))
      setEditingId(null)
    } catch {}
  }

  async function remove(id) {
    await api.delete(`/projects/${slug}/learnings/${id}`)
    setLearnings(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div style={{ padding: '28px 24px', borderTop: '1px solid var(--line)' }}>
      <SectionHead label="APRENDIZADOS" action="+ Nota" onAction={() => setAdding(a => !a)} />

      {adding && (
        <div style={{ marginBottom: 14 }}>
          <textarea
            ref={textRef}
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) add() }}
            placeholder="O que você aprendeu neste projeto?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={add} disabled={saving || !newContent.trim()}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, opacity: saving || !newContent.trim() ? 0.6 : 1 }}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button onClick={() => { setAdding(false); setNewContent('') }}
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {learnings === null ? (
        <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" style={{ margin: '12px 0' }} />
      ) : learnings.length === 0 && !adding ? (
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-3)' }}>
          Capture os aprendizados e descobertas deste projeto.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {learnings.map(l => (
            <div key={l.id} style={{ padding: '13px 14px', borderRadius: 11, border: '1px solid var(--line)', background: 'var(--surface-2)' }}>
              {editingId === l.id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => update(l.id)}
                      style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600 }}>
                      Salvar
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <p style={{ flex: 1, margin: 0, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6 }}>
                    {l.content}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => { setEditingId(l.id); setEditContent(l.content) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 12, padding: '2px 4px', opacity: 0.7 }}>✎</button>
                    <button onClick={() => remove(l.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 14, padding: '2px 4px', opacity: 0.7 }}>×</button>
                  </div>
                </div>
              )}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6 }}>
                {fmtDate(l.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({ project, onClose, onSaved, onDelete, slug }) {
  const [form, setForm] = useState({
    emoji:       project.emoji || '🌱',
    title:       project.title || '',
    description: project.description || '',
    status:      project.status || 'ativo',
    githubUrl:   project.githubUrl || '',
    websiteUrl:  project.websiteUrl || '',
    tags:        (project.tags || []).join(', '),
    startedAt:   toInputDate(project.startedAt),
    completedAt: toInputDate(project.completedAt),
    isFeatured:  project.isFeatured || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })) }

  async function save() {
    setSaving(true); setError('')
    try {
      const updated = await api.patch(`/projects/${slug}`, {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        startedAt: form.startedAt || null,
        completedAt: form.completedAt || null,
        githubUrl: form.githubUrl || null,
        websiteUrl: form.websiteUrl || null,
      })
      onSaved(updated)
      if (updated.slug !== slug) navigate(`/projects/${updated.slug}`, { replace: true })
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  async function del() {
    if (!window.confirm('Apagar este projeto? Esta ação é irreversível.')) return
    try { await api.delete(`/projects/${slug}`); onDelete() } catch {}
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', border: '1px solid var(--line)', width: '100%', maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto', padding: '22px 22px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)' }}>Editar Projeto</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, marginBottom: 14 }}>
          <Field label="EMOJI">
            <input value={form.emoji} onChange={set('emoji')} placeholder="🌱" style={{ ...inputStyle, textAlign: 'center', fontSize: 20 }} />
          </Field>
          <Field label="NOME">
            <input value={form.title} onChange={set('title')} placeholder="Nome do projeto" style={inputStyle} />
          </Field>
        </div>

        <Field label="DESCRIÇÃO">
          <textarea value={form.description} onChange={set('description')} placeholder="O que é este projeto?" rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <Field label="STATUS">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_META).map(([key, { label, color }]) => (
              <button key={key} onClick={() => setForm(f => ({ ...f, status: key }))}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${form.status === key ? color : 'var(--line)'}`,
                  background: form.status === key ? `${color}18` : 'var(--surface-2)',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5,
                  color: form.status === key ? color : 'var(--ink-3)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="INÍCIO">
            <input type="date" value={form.startedAt} onChange={set('startedAt')} style={inputStyle} />
          </Field>
          <Field label="CONCLUSÃO">
            <input type="date" value={form.completedAt} onChange={set('completedAt')} style={inputStyle} />
          </Field>
        </div>

        <Field label="GITHUB URL">
          <input value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/..." style={inputStyle} />
        </Field>
        <Field label="WEBSITE URL">
          <input value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." style={inputStyle} />
        </Field>

        <Field label="TAGS (separadas por vírgula)">
          <input value={form.tags} onChange={set('tags')} placeholder="fotografia, ios, swift" style={inputStyle} />
        </Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)' }}>Destacar no perfil</span>
        </label>

        {error && <p style={{ color: '#f87171', fontFamily: 'var(--sans)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving}
            style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)', cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          <button onClick={del}
            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: '#f87171' }}>
            Apagar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [project, setProject] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${slug}`),
      api.get(`/projects/${slug}/posts`),
    ])
      .then(([proj, projectPosts]) => { setProject(proj); setPosts(projectPosts) })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false))
  }, [slug])

  function goBack() {
    const from = location.state?.from
    if (from) navigate(from)
    else if (window.history.length > 1) navigate(-1)
    else navigate('/projects')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!project) return null

  const statusMeta = STATUS_META[project.status] || STATUS_META.ativo

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)', minHeight: '100vh', paddingBottom: 60 }}>
      <AppBar
        left={
          <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={22} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)' }}>Voltar</span>
          </button>
        }
        right={
          <button onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}>
            <Icon name="edit" size={18} />
          </button>
        }
      />

      {/* Desktop breadcrumb */}
      <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, padding: '18px 28px 0' }}>
        <button onClick={goBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', padding: '4px 8px 4px 4px', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}>
          <Icon name="back" size={15} stroke={1.8} /> Voltar
        </button>
        <span style={{ color: 'var(--line-strong)', fontSize: 12 }}>·</span>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', padding: 0 }}>
          Projetos
        </button>
        <span style={{ color: 'var(--line-strong)', fontSize: 12 }}>→</span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{project.title}</span>
      </div>

      {/* Hero */}
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 16 }}>
          <span style={{ fontSize: 52, lineHeight: 1 }}>{project.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
              {project.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMeta.color }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                  {statusMeta.label.toUpperCase()}
                </span>
              </span>
              {project.startedAt && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
                  {fmtShort(project.startedAt)}{project.completedAt ? ` → ${fmtShort(project.completedAt)}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p style={{ margin: '0 0 16px', fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: 560 }}>
            {project.description}
          </p>
        )}

        {/* Stats row */}
        {(project.postCount > 0 || project.photoCount > 0 || project.fileCount > 0) && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            {project.postCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{project.postCount} posts</span>}
            {project.photoCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>📷 {project.photoCount}</span>}
            {project.fileCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>📎 {project.fileCount}</span>}
            {project.lastActivityAt && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto' }}>atividade {fmtAgo(project.lastActivityAt)}</span>}
          </div>
        )}

        {/* Links */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', textDecoration: 'none' }}>
              <Icon name="code" size={14} stroke={1.5} /> GitHub
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', textDecoration: 'none' }}>
              <Icon name="explore" size={14} stroke={1.5} /> Site
            </a>
          )}
          {(project.tags || []).map(tag => (
            <span key={tag} style={{ fontFamily: 'var(--mono)', fontSize: 10.5, padding: '3px 9px', borderRadius: 20, background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}>
              {tag}
            </span>
          ))}
          <button onClick={() => setEditing(true)}
            style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer', padding: '5px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            Editar
          </button>
        </div>
      </div>

      {/* Milestones */}
      <MilestonesSection slug={slug} />

      {/* Timeline */}
      <div style={{ padding: '28px 24px', borderTop: '1px solid var(--line)' }}>
        <SectionHead label={`TIMELINE — ${posts.length} ${posts.length === 1 ? 'ENTRADA' : 'ENTRADAS'}`} />
        {posts.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.7 }}>
            Nenhuma entrada vinculada. Ao criar um post, selecione este projeto.
          </p>
        ) : (
          <div>{posts.map(p => <PostItem key={p.id} post={p} />)}</div>
        )}
      </div>

      {/* Learnings */}
      <LearningsSection slug={slug} />

      {/* Edit panel */}
      {editing && (
        <EditPanel
          project={project}
          slug={slug}
          onClose={() => setEditing(false)}
          onSaved={updated => { setProject(updated); setEditing(false) }}
          onDelete={() => navigate('/projects')}
        />
      )}
    </div>
  )
}
