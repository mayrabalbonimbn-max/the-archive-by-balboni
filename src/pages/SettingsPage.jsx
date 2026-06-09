import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportPostsAsMarkdown } from '../utils/storage'
import { api, getPushVapidKey, subscribePush, unsubscribePush, sendTestPush } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'

function exportPostsAsJSON(posts) {
  const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `the-archive-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

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

export default function SettingsPage({ profile, posts, onUpdateProfile, onUploadProfileMedia, onRemoveProfileMedia, onImportPosts, onLogout, onResetOnboarding }) {
  const navigate = useNavigate()
  const [name, setName] = useState(profile.name)
  const [handle, setHandle] = useState(profile.handle)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [title, setTitle] = useState(profile.title ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
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

  const [pushPermission, setPushPermission] = useState(Notification?.permission || 'default')
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushMsg, setPushMsg] = useState('')
  const [pushDiag, setPushDiag] = useState(null) // { swOk, permOk, subOk }

  useEffect(() => {
    const swOk = 'serviceWorker' in navigator
    const permOk = Notification?.permission === 'granted'
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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return setPushMsg('Seu navegador não suporta push notifications.')
    }
    setPushLoading(true)
    setPushMsg('')
    try {
      const perm = await Notification.requestPermission()
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
      await onUpdateProfile({ name, handle, bio, title, location })
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
        title="Ajustes"
      />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ── Perfil ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Perfil" />

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

        {/* ── Exportar ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Exportar" />
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            Backup dos seus {posts.length} registros.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <OutlineBtn onClick={() => exportPostsAsJSON(posts)}>Exportar JSON</OutlineBtn>
            <OutlineBtn onClick={() => exportPostsAsMarkdown(posts)}>Exportar Markdown</OutlineBtn>
          </div>
        </div>

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

        {/* ── Notificações Push ── */}
        <div style={{ marginBottom: 40 }}>
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
        </div>

        {/* ── Estatísticas ── */}
        <div style={{ marginBottom: 40 }}>
          <SectionHead label="Estatísticas" />
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
            Veja um resumo do seu uso e do seu arquivo ao longo do tempo.
          </div>
          <OutlineBtn onClick={() => navigate('/stats')}>Ver estatísticas</OutlineBtn>
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

      </div>
    </div>
  )
}
