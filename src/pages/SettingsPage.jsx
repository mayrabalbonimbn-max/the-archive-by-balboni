import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getPushVapidKey, subscribePush, unsubscribePush, sendTestPush } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'

function DiagRow({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: ok ? '#4ade80' : '#f87171', fontSize: 13 }}>{ok ? '✓' : '✗'}</span>
      <span style={{ color: ok ? 'var(--ink-2)' : 'var(--ink-3)' }}>{label}</span>
    </div>
  )
}

// ── Shared field styles ────────────────────────────────────────────────────────
const fieldLabel = {
  fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em',
  color: 'var(--ink-3)', textTransform: 'uppercase', display: 'block', marginBottom: 8,
}

const fieldInput = {
  width: '100%', background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--line-strong)', borderRadius: 10,
  padding: '11px 14px', color: 'var(--ink)',
  fontFamily: 'var(--sans)', fontSize: 14.5, outline: 'none',
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

function SectionHead({ label }) {
  return (
    <div style={{ marginBottom: 20, marginTop: 4 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{label}</div>
      <div style={{ marginTop: 6, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

function SectionNote({ children }) {
  return (
    <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginTop: -8, marginBottom: 16, lineHeight: 1.6 }}>
      {children}
    </p>
  )
}

const PUBLIC_SECTION_OPTIONS = [
  { id: 'projects', label: 'Projetos' },
  { id: 'collections', label: 'Coleções' },
  { id: 'photos', label: 'Fotos' },
  { id: 'articles', label: 'Ensaios' },
  { id: 'entries', label: 'Entradas recentes' },
  { id: 'trajectory', label: 'Trajetória' },
]

const SETTINGS_GROUPS = [
  { id: 'account', label: 'Conta' },
  { id: 'invites', label: 'Convites' },
  { id: 'data', label: 'Dados' },
  { id: 'notifications', label: 'Notificações' },
  { id: 'security', label: 'Segurança' },
]

function OutlineBtn({ onClick, children, danger = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '11px 18px', borderRadius: 11, cursor: disabled ? 'default' : 'pointer',
        border: `1px solid ${danger ? 'rgba(248,113,113,0.4)' : 'var(--line-strong)'}`,
        background: 'transparent',
        color: danger ? '#f87171' : 'var(--ink)',
        fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function AccentBtn({ onClick, children, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '11px 24px', borderRadius: 11, cursor: disabled ? 'default' : 'pointer',
        border: 'none', background: disabled ? 'var(--surface-3)' : 'var(--accent)',
        color: disabled ? 'var(--ink-3)' : '#fff',
        fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  )
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function triggerDownload(format) {
  const token = localStorage.getItem('ms_token')
  const a = document.createElement('a')
  a.href = `${API_BASE}/me/export?format=${format}&token=${encodeURIComponent(token || '')}`
  a.download = ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function ExportSection() {
  const [loading, setLoading] = useState(null)

  async function handleExport(format) {
    setLoading(format)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      triggerDownload(format)
    } finally {
      setTimeout(() => setLoading(null), 2000)
    }
  }

  const formats = [
    {
      key: 'zip',
      icon: '⬇',
      label: 'ZIP completo',
      desc: 'Todos os dados + arquivos de mídia (fotos, áudios, vídeos). Leva tudo.',
      accent: true,
    },
    {
      key: 'json',
      icon: '{ }',
      label: 'JSON estruturado',
      desc: 'Export completo em JSON: entradas, artigos, cápsulas, projetos, coleções e comentários.',
      accent: false,
    },
    {
      key: 'markdown',
      icon: '#',
      label: 'Markdown legível',
      desc: 'Um único arquivo .md com todo o seu arquivo, organizado por seção.',
      accent: false,
    },
  ]

  return (
    <div style={{ marginBottom: 40 }}>
      <SectionHead label="Exportar meu arquivo" />
      <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
        Seus dados são seus. Faça um backup completo quando quiser: JSON para restaurar, Markdown para ler e ZIP para levar mídias junto.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {formats.map(f => (
          <button
            key={f.key}
            onClick={() => handleExport(f.key)}
            disabled={loading !== null}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
              padding: '14px 16px', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
              border: `1px solid ${f.accent ? 'var(--accent)' : 'var(--line-strong)'}`,
              background: f.accent ? 'rgba(232,108,180,0.06)' : 'transparent',
              opacity: loading && loading !== f.key ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <span style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: f.accent ? 'rgba(232,108,180,0.15)' : 'rgba(255,255,255,0.06)',
              fontFamily: 'var(--mono)', fontSize: 12, color: f.accent ? 'var(--accent)' : 'var(--ink-2)',
              flexShrink: 0,
            }}>
              {loading === f.key ? '…' : f.icon}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: f.accent ? 'var(--accent)' : 'var(--ink)', marginBottom: 2 }}>
                {f.label}
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                {f.desc}
              </span>
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 16, flexShrink: 0 }}>↓</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function fmtInviteDate(iso) {
  if (!iso) return 'Sem expiração'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function inviteStatus(invite) {
  if (invite.revokedAt) return { label: 'Revogado', color: '#f87171' }
  if (!invite.valid) return { label: 'Usado/expirado', color: '#f59e0b' }
  return { label: 'Ativo', color: '#4ade80' }
}

function InviteSettingsSection() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ note: '', maxUses: 1, expiresDays: 30 })

  useEffect(() => {
    let ignore = false
    api.get('/auth/invites')
      .then(data => { if (!ignore) setInvites(data) })
      .catch(err => { if (!ignore) setError(err.message) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  async function createInvite(e) {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      const invite = await api.post('/auth/invites', {
        note: form.note.trim() || undefined,
        maxUses: Number(form.maxUses) || 1,
        expiresDays: Number(form.expiresDays) || undefined,
      })
      setInvites(prev => [invite, ...prev])
      setForm({ note: '', maxUses: 1, expiresDays: 30 })
      copyInvite(invite.code)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  function copyInvite(code) {
    const signupUrl = `${window.location.origin}/?view=register&invite=${encodeURIComponent(code)}`
    const text = `Mayra te convidou para criar seu arquivo no The Archive.\n\n1. Acesse: ${signupUrl}\n2. Escolha "Criar perfil"\n3. Use este código de convite: ${code}\n\nO Archive é um lugar para guardar ideias, memórias, projetos e fotos com calma.`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(''), 2200)
    }).catch(() => {})
  }

  async function revokeInvite(code) {
    setError('')
    try {
      await api.delete(`/auth/invites/${code}`)
      setInvites(prev => prev.map(inv => inv.code === code ? { ...inv, revokedAt: new Date().toISOString(), valid: false } : inv))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <SectionHead label="Área administrativa" />
      <SectionNote>
        Gere códigos para liberar a criação de novos perfis. Esta área só aparece para admins.
      </SectionNote>
      <div style={{ marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase' }}>
        Convites
      </div>

      <form onSubmit={createInvite} style={{ marginBottom: 16 }}>
        <Field label="Nome ou observação">
          <input
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            style={fieldInput}
            placeholder="Ex: Ana, cliente, família..."
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Usos">
            <input
              type="number"
              min="1"
              max="20"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              style={fieldInput}
            />
          </Field>
          <Field label="Expira em dias">
            <input
              type="number"
              min="1"
              max="365"
              value={form.expiresDays}
              onChange={e => setForm(f => ({ ...f, expiresDays: e.target.value }))}
              style={fieldInput}
            />
          </Field>
        </div>

        {error && (
          <div style={{ marginBottom: 12, fontFamily: 'var(--sans)', fontSize: 13, color: '#f87171' }}>
            {error}
          </div>
        )}

        <AccentBtn type="submit" disabled={creating}>
          {creating ? 'Gerando...' : 'Gerar convite'}
        </AccentBtn>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)' }}>Carregando convites...</div>
        ) : invites.length === 0 ? (
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)' }}>Nenhum convite criado ainda.</div>
        ) : (
          invites.map(invite => {
            const status = inviteStatus(invite)
            return (
              <div key={invite.id} style={{ border: '1px solid var(--line-strong)', borderRadius: 12, padding: '13px 14px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', letterSpacing: '0.04em', wordBreak: 'break-all' }}>
                      {invite.code}
                    </div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 5 }}>
                      {invite.note || 'Sem observação'} · {invite.usedCount}/{invite.maxUses} usos · {fmtInviteDate(invite.expiresAt)}
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 9.5, color: status.color, border: `1px solid ${status.color}55`, borderRadius: 999, padding: '4px 8px' }}>
                    {status.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <OutlineBtn onClick={() => copyInvite(invite.code)}>
                    {copied === invite.code ? 'Copiado' : 'Copiar código e link'}
                  </OutlineBtn>
                  {invite.valid && (
                    <OutlineBtn danger onClick={() => revokeInvite(invite.code)}>
                      Revogar
                    </OutlineBtn>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function SettingsPage({ profile, posts, onUpdateProfile, onUploadProfileMedia, onRemoveProfileMedia, onImportPosts, onLogout, onResetOnboarding }) {
  const navigate = useNavigate()
  // Safe defaults so hooks are always called unconditionally (rules of hooks)
  const [name, setName] = useState(profile?.name ?? '')
  const [handle, setHandle] = useState(profile?.handle ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [publicIntro, setPublicIntro] = useState(profile?.publicIntro ?? '')
  const [publicSections, setPublicSections] = useState(profile?.publicSections ?? ['projects', 'collections', 'photos', 'entries'])
  const [saved, setSaved] = useState(false)
  const [importMode, setImportMode] = useState('merge')
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)
  const avatarInputRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [pushPermission, setPushPermission] = useState(window.Notification?.permission || 'default')
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushMsg, setPushMsg] = useState('')
  const [pushDiag, setPushDiag] = useState(null) // { swOk, permOk, subOk }
  const canManageInvites = profile?.isAdmin === true
  const [settingsGroup, setSettingsGroup] = useState('account')
  const visibleGroups = SETTINGS_GROUPS.filter(g => g.id !== 'invites' || canManageInvites)

  useEffect(() => {
    const swOk = 'serviceWorker' in navigator
    const permOk = window.Notification?.permission === 'granted'
    if (!swOk || !('PushManager' in window)) {
      setPushDiag({ swOk: false, permOk, subOk: false })
      return
    }
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        const subOk = !!sub
        setPushSubscribed(subOk)
        setPushDiag({ swOk: true, permOk, subOk })
      })
    }).catch(() => {
      setPushDiag({ swOk: true, permOk, subOk: false })
    })
  }, [])

  async function handleEnablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !window.Notification) {
      return setPushMsg('Seu navegador não suporta push notifications.')
    }
    setPushLoading(true)
    setPushMsg('')
    try {
      const perm = await window.Notification.requestPermission()
      setPushPermission(perm)
      if (perm !== 'granted') {
        return setPushMsg('Permissão negada. Habilite notificações nas configurações do navegador.')
      }
      const { publicKey } = await getPushVapidKey()
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await subscribePush(sub.toJSON())
      setPushSubscribed(true)
      setPushMsg('Notificações push ativadas!')
    } catch (err) {
      setPushMsg(err.message || 'Não foi possível ativar as notificações.')
    } finally {
      setPushLoading(false)
      setTimeout(() => setPushMsg(''), 4000)
    }
  }

  async function handleDisablePush() {
    setPushLoading(true)
    setPushMsg('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await unsubscribePush(sub.endpoint)
        await sub.unsubscribe()
      }
      setPushSubscribed(false)
      setPushMsg('Notificações push desativadas.')
    } catch (err) {
      setPushMsg(err.message || 'Erro ao desativar notificações.')
    } finally {
      setPushLoading(false)
      setTimeout(() => setPushMsg(''), 3000)
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  async function handleSaveProfile() {
    try {
      await onUpdateProfile({ name, handle, bio, title, location, publicIntro, publicSections })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await onUploadProfileMedia('avatar', file) }
    catch (err) { alert(err.message) }
    finally { e.target.value = '' }
  }

  async function handleRemoveAvatar() {
    try { await onRemoveProfileMedia('avatar') }
    catch (err) { alert(err.message) }
  }

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data)) throw new Error('Formato inválido')
        onImportPosts(data, importMode === 'replace')
        setImportStatus({ ok: true, count: data.length })
      } catch (err) {
        setImportStatus({ ok: false, msg: err.message })
      }
      setTimeout(() => setImportStatus(null), 4000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordStatus(null)
    if (!currentPassword) return setPasswordStatus({ ok: false, msg: 'Informe a senha atual.' })
    if (newPassword.length < 6) return setPasswordStatus({ ok: false, msg: 'Nova senha deve ter ao menos 6 caracteres.' })
    if (newPassword !== confirmPassword) return setPasswordStatus({ ok: false, msg: 'As senhas não coincidem.' })
    setPasswordLoading(true)
    try {
      await api.post('/me/password', { currentPassword, newPassword })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPasswordStatus({ ok: true, msg: 'Senha atualizada!' })
    } catch (err) {
      setPasswordStatus({ ok: false, msg: err.message })
    } finally {
      setPasswordLoading(false)
      setTimeout(() => setPasswordStatus(null), 3000)
    }
  }

  function togglePublicSection(section) {
    setPublicSections(cur => cur.includes(section) ? cur.filter(s => s !== section) : [...cur, section])
  }

  const publicPreview = [
    publicIntro?.trim() ? publicIntro.trim() : 'Escreva uma apresentação curta para a sua vitrine.',
    `${publicSections.length} seção(ões) visível(is)`,
    profile?.publicSections?.includes('trajectory') ? 'Trajetória pública ativa' : 'Trajetória oculta',
  ]

  // Diagnostic guard (should never happen if App.jsx is working correctly)
  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: '#000', color: '#f2ede6', fontFamily: 'monospace', fontSize: 13, padding: '32px 20px' }}>
        <div style={{ color: '#f87171', marginBottom: 12 }}>BUG: SettingsPage recebeu profile=null</div>
        <div style={{ color: '#aba49a' }}>token: {!!localStorage.getItem('ms_token') ? 'presente' : 'ausente'}</div>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 16px', border: '1px solid #333', background: 'transparent', color: '#f2ede6', cursor: 'pointer', borderRadius: 8 }}>Voltar</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="back" size={22} />
          </button>
        }
        title="Configurações"
      />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 26 }}>
          {visibleGroups.map(group => {
            const on = settingsGroup === group.id
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setSettingsGroup(group.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--line-strong)'}`,
                  background: on ? 'rgba(232,108,180,0.12)' : 'transparent',
                  color: on ? 'var(--accent)' : 'var(--ink-3)',
                  fontFamily: 'var(--sans)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {group.label}
              </button>
            )
          })}
        </div>

        {/* ── Perfil ── */}
        {settingsGroup === 'account' && <><div style={{ marginBottom: 40 }}>
          <SectionHead label="Perfil" />
          <SectionNote>
            Ajuste o que aparece para quem visita seu perfil e o jeito como você quer ser apresentada.
          </SectionNote>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            >
              <Avatar name={profile.name} src={profile.avatar} size={64} ring />
            </div>
            <div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Trocar foto de perfil
              </button>
              {profile.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  style={{ display: 'block', marginTop: 4, fontFamily: 'var(--sans)', fontSize: 12.5, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Remover foto
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>

          <Field label="Nome">
            <input value={name} onChange={e => setName(e.target.value)} style={fieldInput} placeholder="Seu nome" />
          </Field>

          <Field label="@handle">
            <input value={handle} onChange={e => setHandle(e.target.value)} style={fieldInput} placeholder="@handle" />
          </Field>

          <Field label="Título">
            <input value={title} onChange={e => setTitle(e.target.value)} style={fieldInput} placeholder="Ex: Escritora, Fotógrafa, Estudante…" />
          </Field>

          <Field label="Bio">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              style={{ ...fieldInput, resize: 'none' }}
              rows={3}
              placeholder="Sobre você…"
            />
          </Field>

          <Field label="Localização">
            <input value={location} onChange={e => setLocation(e.target.value)} style={fieldInput} placeholder="Ex: São Paulo, Brasil" />
          </Field>

          <AccentBtn onClick={handleSaveProfile}>
            {saved ? '✓ Salvo!' : 'Salvar perfil'}
          </AccentBtn>
        </div>

        {/* ── Perfil público ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Perfil público" />
          <SectionNote>
            A vitrine pública é sua apresentação. Conteúdo privado continua privado.
          </SectionNote>
          <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase' }}>
              Preview rápido
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {publicPreview.map((item, idx) => (
                <div key={idx} style={{ fontFamily: idx === 0 ? 'var(--serif)' : 'var(--mono)', fontSize: idx === 0 ? 14.5 : 10.5, color: idx === 0 ? 'var(--ink)' : 'var(--ink-3)', lineHeight: 1.5 }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <OutlineBtn onClick={() => navigate(`/profiles/${profile.id}`)}>
                Ver perfil público
              </OutlineBtn>
            </div>
          </div>
          <Field label="Apresentação pública">
            <textarea
              value={publicIntro}
              onChange={e => setPublicIntro(e.target.value)}
              style={{ ...fieldInput, resize: 'none' }}
              rows={3}
              maxLength={240}
              placeholder="Ex: Um arquivo sobre fotografia, tecnologia, estudos e projetos em construção."
            />
          </Field>
          <div style={{ marginBottom: 18 }}>
            <label style={fieldLabel}>Mostrar na vitrine</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PUBLIC_SECTION_OPTIONS.map(opt => {
                const on = publicSections.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => togglePublicSection(opt.id)}
                    style={{
                      padding: '8px 13px',
                      borderRadius: 999,
                      border: `1px solid ${on ? 'var(--accent)' : 'var(--line-strong)'}`,
                      background: on ? 'rgba(232,108,180,0.12)' : 'transparent',
                      color: on ? 'var(--accent)' : 'var(--ink-3)',
                      fontFamily: 'var(--sans)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          <AccentBtn onClick={handleSaveProfile}>
            {saved ? '✓ Salvo!' : 'Salvar vitrine'}
          </AccentBtn>
        </div></>}

        {settingsGroup === 'invites' && canManageInvites && <InviteSettingsSection />}

        {/* ── Exportar ── */}
        {settingsGroup === 'data' && <>
        <ExportSection />

        {/* ── Importar ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Importar" />
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            Restaure registros de um arquivo JSON exportado anteriormente.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['merge', 'replace'].map(mode => (
              <button
                key={mode}
                onClick={() => setImportMode(mode)}
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${importMode === mode ? 'transparent' : 'var(--line-strong)'}`,
                  background: importMode === mode ? 'var(--accent)' : 'transparent',
                  color: importMode === mode ? '#fff' : 'var(--ink-2)',
                  fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
                }}
              >
                {mode === 'merge' ? 'Mesclar' : 'Substituir'}
              </button>
            ))}
          </div>
          {importMode === 'replace' && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#fbbf24', marginBottom: 12 }}>
              Isso substituirá todos os registros deste perfil.
            </div>
          )}
          <OutlineBtn onClick={() => fileInputRef.current?.click()}>Escolher arquivo JSON</OutlineBtn>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
          {importStatus && (
            <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 10, fontFamily: 'var(--sans)', fontSize: 13, color: importStatus.ok ? '#4ade80' : '#f87171', border: `1px solid ${importStatus.ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`, background: importStatus.ok ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)' }}>
              {importStatus.ok ? `✓ ${importStatus.count} registros importados!` : `Erro: ${importStatus.msg}`}
            </div>
          )}
        </div>

        {/* ── Estatísticas ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Estatísticas" />
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            Veja um resumo do seu uso e do seu arquivo ao longo do tempo.
          </div>
          <OutlineBtn onClick={() => navigate('/stats')}>Ver estatísticas</OutlineBtn>
        </div>
        </>}

        {/* ── Notificações Push ── */}
        {settingsGroup === 'notifications' && <div style={{ marginBottom: 40 }}>
          <SectionHead label="Notificações" />

          {/* Diagnostic checklist */}
          {pushDiag && (
            <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)', fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.9 }}>
              <DiagRow ok={pushDiag.swOk} label="Service worker registrado" />
              <DiagRow ok={pushDiag.permOk} label="Permissão de notificações concedida" />
              <DiagRow ok={pushDiag.subOk} label="Subscription ativa (salva no servidor)" />
              {!pushDiag.subOk && pushDiag.swOk && (
                <div style={{ marginTop: 4, color: 'var(--ink-3)', fontSize: 11 }}>
                  {!pushDiag.permOk
                    ? 'No iOS: instale o app na tela inicial e então ative as notificações aqui.'
                    : 'Clique em "Ativar notificações push" para criar a subscription.'}
                </div>
              )}
            </div>
          )}

          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            {!('serviceWorker' in navigator) || !('PushManager' in window)
              ? 'Seu navegador não suporta push notifications.'
              : pushPermission === 'denied'
              ? 'Notificações bloqueadas no navegador. Habilite nas configurações do site.'
              : pushSubscribed
              ? 'Notificações push ativas. Você receberá alertas de curtidas, comentários e seguidores.'
              : 'Receba notificações no celular ou navegador quando alguém interagir com suas entradas.'}
          </div>
          {pushMsg && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: pushMsg.startsWith('✓') ? '#4ade80' : '#f87171', marginBottom: 12 }}>
              {pushMsg}
            </div>
          )}
          {pushSubscribed ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <AccentBtn onClick={async () => {
                setPushLoading(true)
                setPushMsg('')
                try {
                  const result = await sendTestPush()
                  const detail = result.total != null
                    ? ` (${result.sent}/${result.total} entregue${result.total !== 1 ? 's' : ''})`
                    : ''
                  setPushMsg(`✓ Push enviado${detail}. Verifique seu celular.`)
                } catch (err) {
                  setPushMsg(err.message || 'Erro ao enviar notificação de teste.')
                } finally {
                  setPushLoading(false)
                  setTimeout(() => setPushMsg(''), 7000)
                }
              }} disabled={pushLoading}>
                {pushLoading ? 'Enviando…' : 'Enviar notificação de teste'}
              </AccentBtn>
              <OutlineBtn onClick={handleDisablePush} disabled={pushLoading}>
                Desativar
              </OutlineBtn>
            </div>
          ) : (
            <AccentBtn onClick={handleEnablePush} disabled={pushLoading || pushPermission === 'denied' || !('PushManager' in window)}>
              {pushLoading ? 'Ativando…' : 'Ativar notificações push'}
            </AccentBtn>
          )}
        </div>}

        {settingsGroup === 'security' && <>
        {/* ── Senha ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Senha" />
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Senha atual">
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={fieldInput} placeholder="Senha atual" />
            </Field>
            <Field label="Nova senha">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={fieldInput} placeholder="Mínimo 6 caracteres" />
            </Field>
            {newPassword && (
              <Field label="Confirmar">
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={fieldInput} placeholder="Repita a nova senha" />
              </Field>
            )}
            {passwordStatus && (
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: passwordStatus.ok ? '#4ade80' : '#f87171' }}>
                {passwordStatus.msg}
              </div>
            )}
            <AccentBtn type="submit" disabled={passwordLoading || !currentPassword || !newPassword}>
              {passwordLoading ? 'Salvando…' : 'Atualizar senha'}
            </AccentBtn>
          </form>
        </div>

        {/* ── Sessão ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Sessão" />
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            Logado como <span style={{ color: 'var(--ink)' }}>{profile.handle}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            {onResetOnboarding && (
              <OutlineBtn onClick={onResetOnboarding}>Refazer Tour</OutlineBtn>
            )}
            <OutlineBtn onClick={onLogout}>Sair do perfil</OutlineBtn>
          </div>
        </div>

        {/* ── Perigo ── */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: '#f87171', letterSpacing: '-0.01em' }}>Zona de perigo</div>
            <div style={{ marginTop: 6, height: 1, background: 'rgba(248,113,113,0.2)' }} />
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            Ações irreversíveis. Tenha certeza antes de prosseguir.
          </div>
          <OutlineBtn
            danger
            onClick={() => {
              if (window.confirm('Deletar TODOS os registros deste perfil? Esta ação não pode ser desfeita.')) {
                onImportPosts([], true)
              }
            }}
          >
            Deletar todos os registros
          </OutlineBtn>
        </div>
        </>}

      </div>
    </div>
  )
}
