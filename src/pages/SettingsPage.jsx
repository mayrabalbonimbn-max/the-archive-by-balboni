import { useState, useRef } from 'react'
import { exportPostsAsMarkdown } from '../utils/storage'
import { api } from '../utils/api'

const HEADER_COLORS = [
  'linear-gradient(135deg, #c084fc, #f472b6)',
  'linear-gradient(135deg, #f472b6, #f97316)',
  'linear-gradient(135deg, #10b981, #1d9bf0)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #0ea5e9, #10b981)',
  '#f472b6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
]

function exportPostsAsJSON(posts) {
  const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `the-archive-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage({ profile, posts, onUpdateProfile, onUploadProfileMedia, onRemoveProfileMedia, onImportPosts, onLogout }) {
  const [name, setName] = useState(profile.name)
  const [handle, setHandle] = useState(profile.handle)
  const [bio, setBio] = useState(profile.bio)
  const [interests, setInterests] = useState(profile.interests || '')
  const [headerColor, setHeaderColor] = useState(profile.headerColor || HEADER_COLORS[0])
  const [saved, setSaved] = useState(false)
  const [importMode, setImportMode] = useState('merge')
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleSaveProfile() {
    try {
      await onUpdateProfile({ name, handle, bio, headerColor, interests })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleCoverUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      await onUploadProfileMedia('cover', file)
    } catch (err) {
      alert(err.message)
    } finally {
      e.target.value = ''
    }
  }

  async function handleRemoveCover() {
    try {
      await onRemoveProfileMedia('cover')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      await onUploadProfileMedia('avatar', file)
    } catch (err) {
      alert(err.message)
    } finally {
      e.target.value = ''
    }
  }

  async function handleRemoveAvatar() {
    try {
      await onRemoveProfileMedia('avatar')
    } catch (err) {
      alert(err.message)
    }
  }

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
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
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus({ ok: true, msg: 'Senha atualizada!' })
    } catch (err) {
      setPasswordStatus({ ok: false, msg: err.message })
    } finally {
      setPasswordLoading(false)
      setTimeout(() => setPasswordStatus(null), 3000)
    }
  }

  const SectionIcon = ({ d }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-rose">
      <path d={d} />
    </svg>
  )

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <h1 className="font-bold text-xl text-dark-text">Ajustes</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-8">

        {/* Profile */}
        <section>
          <h2 className="font-bold text-dark-text text-lg mb-4 flex items-center gap-2">
            <SectionIcon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z" />
            Perfil
          </h2>

          {/* Cover image */}
          <div className="mb-5">
            <label className="block text-dark-muted text-xs mb-2 tracking-wide uppercase">Capa do perfil</label>
            <div
              className="relative h-24 rounded-xl overflow-hidden cursor-pointer group border border-dark-border hover:border-dark-muted/50 transition-colors"
              style={{ background: profile.coverImage ? undefined : (profile.headerColor || 'linear-gradient(135deg, #8b5cf6, #1d9bf0)') }}
              onClick={() => coverInputRef.current?.click()}
            >
              {profile.coverImage && (
                <img src={profile.coverImage} alt="capa" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Trocar capa</span>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => coverInputRef.current?.click()} className="text-brand-rose text-sm hover:underline font-medium">
                {profile.coverImage ? 'Trocar foto de capa' : 'Adicionar foto de capa'}
              </button>
              {profile.coverImage && (
                <button onClick={handleRemoveCover} className="text-red-400 text-sm hover:underline">
                  Remover
                </button>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-dark-border" onClick={() => avatarInputRef.current?.click()}>
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold text-2xl">
                    {profile.name?.[0] || 'M'}
                  </div>
              }
            </div>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => avatarInputRef.current?.click()} className="text-brand-rose text-sm hover:underline font-medium text-left">
                Trocar foto de perfil
              </button>
              {profile.avatar && (
                <button onClick={handleRemoveAvatar} className="text-red-400 text-sm hover:underline text-left">
                  Remover foto
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
          </div>

          {/* Header color */}
          <div className="mb-5">
            <label className="block text-dark-muted text-xs mb-2 tracking-wide uppercase">Cor do cabeçalho</label>
            <div className="flex flex-wrap gap-2">
              {HEADER_COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setHeaderColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${headerColor === color ? 'ring-2 ring-offset-2 ring-offset-black ring-brand-rose scale-110' : 'hover:scale-110'}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-dark" placeholder="Seu nome" />
            </div>
            <div>
              <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">@handle</label>
              <input value={handle} onChange={e => setHandle(e.target.value)} className="input-dark" placeholder="@seu_handle" />
            </div>
            <div>
              <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="input-dark resize-none" rows={3} placeholder="Sobre você..." />
            </div>
            <div>
              <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Interesses</label>
              <input
                value={interests}
                onChange={e => setInterests(e.target.value)}
                className="input-dark"
                placeholder="Python, Fotografia, Design, Leitura..."
              />
              <p className="text-dark-muted text-xs mt-1.5">Separe com vírgula. Aparece como tags no perfil.</p>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className={`mt-4 btn-primary transition-all ${saved ? '!bg-emerald-600 hover:!bg-emerald-600' : ''}`}
          >
            {saved ? '✓ Salvo!' : 'Salvar perfil'}
          </button>
        </section>

        {/* Password */}
        <section className="border-t border-dark-border pt-6">
          <h2 className="font-bold text-dark-text text-lg mb-1 flex items-center gap-2">
            <SectionIcon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            Senha
          </h2>
          <p className="text-dark-muted text-sm mb-4">Altere a senha da sua conta.</p>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Senha atual</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-dark" placeholder="Sua senha atual" />
            </div>
            <div>
              <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Nova senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-dark" placeholder="Mínimo 6 caracteres" />
            </div>
            {newPassword && (
              <div>
                <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Confirmar</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-dark" placeholder="Repita a nova senha" />
              </div>
            )}

            {passwordStatus && (
              <p className={`text-sm animate-fade-in ${passwordStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {passwordStatus.msg}
              </p>
            )}

            <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword} className="btn-primary text-sm py-2">
              {passwordLoading ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </form>
        </section>

        {/* Export */}
        <section className="border-t border-dark-border pt-6">
          <h2 className="font-bold text-dark-text text-lg mb-4 flex items-center gap-2">
            <SectionIcon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
            Exportar
          </h2>
          <p className="text-dark-muted text-sm mb-4">Faça backup dos seus {posts.length} posts.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportPostsAsJSON(posts)}
              className="flex items-center gap-2 border border-dark-border text-dark-text px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-dark-hover transition-colors"
            >
              Exportar JSON
            </button>
            <button onClick={() => exportPostsAsMarkdown(posts)} className="flex items-center gap-2 border border-dark-border text-dark-text px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-dark-hover transition-colors">
              Exportar Markdown
            </button>
          </div>
        </section>

        {/* Import */}
        <section className="border-t border-dark-border pt-6">
          <h2 className="font-bold text-dark-text text-lg mb-4 flex items-center gap-2">
            <SectionIcon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />
            Importar
          </h2>
          <p className="text-dark-muted text-sm mb-4">Restaure posts de um arquivo JSON exportado anteriormente.</p>

          <div className="flex gap-3 mb-4">
            {['merge', 'replace'].map(mode => (
              <button
                key={mode}
                onClick={() => setImportMode(mode)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  importMode === mode
                    ? 'border-brand-rose bg-brand-rose/10 text-brand-rose'
                    : 'border-dark-border text-dark-muted hover:border-dark-text'
                }`}
              >
                {mode === 'merge' ? 'Mesclar' : 'Substituir'}
              </button>
            ))}
          </div>

          {importMode === 'replace' && (
            <p className="text-amber-400 text-sm mb-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Isso substituirá todos os posts deste perfil!
            </p>
          )}

          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border border-dark-border text-dark-text px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-dark-hover transition-colors">
            Escolher arquivo JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />

          {importStatus && (
            <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium ${importStatus.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {importStatus.ok ? `✓ ${importStatus.count} posts importados!` : `Erro: ${importStatus.msg}`}
            </div>
          )}
        </section>

        {/* Session / logout */}
        <section className="border-t border-dark-border pt-6">
          <h2 className="font-bold text-dark-text text-lg mb-4 flex items-center gap-2">
            <SectionIcon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
            Sessão
          </h2>
          <p className="text-dark-muted text-sm mb-4">
            Logado como <span className="text-dark-text font-medium">{profile.handle}</span>
          </p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 border border-dark-border text-dark-muted px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all"
          >
            Sair do perfil
          </button>
        </section>

        {/* Danger zone */}
        <section className="border-t border-dark-border pt-6">
          <h2 className="font-bold text-red-400 text-lg mb-4">Zona de Perigo</h2>
          <p className="text-dark-muted text-sm mb-4">Ações irreversíveis. Tenha certeza antes de prosseguir.</p>
          <button
            onClick={() => {
              if (window.confirm('Deletar TODOS os posts deste perfil? Esta ação não pode ser desfeita.')) {
                onImportPosts([], true)
              }
            }}
            className="border border-red-500/50 text-red-400 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            Deletar todos os posts
          </button>
        </section>

      </div>
    </div>
  )
}
