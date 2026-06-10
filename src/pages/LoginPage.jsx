import { useEffect, useState } from 'react'
import { authApi, getSignupMode } from '../utils/api'

const HEADER_COLORS = [
  'linear-gradient(135deg, #c084fc, #f472b6)',
  'linear-gradient(135deg, #f472b6, #f97316)',
  'linear-gradient(135deg, #10b981, #1d9bf0)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
]

// ─── Login form ───────────────────────────────────────────────────────────────
function LoginView({ onLogin, onSwitchToRegister, onSwitchToReset }) {
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!handle.trim() || !password) return setError('Handle e senha são obrigatórios.')
    setLoading(true)
    try {
      const data = await authApi.login({ handle: handle.trim(), password })
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-dark-text font-editorial text-2xl text-center mb-1">Bem-vinda de volta</h2>
      <p className="text-dark-muted text-sm text-center mb-6">Entre no seu cantinho</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">@handle</label>
          <input
            value={handle}
            onChange={e => setHandle(e.target.value)}
            className="input-dark"
            placeholder="@seu_handle"
            autoFocus
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-dark"
            placeholder="Sua senha"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={onSwitchToReset}
            className="block ml-auto mt-2 text-brand-rose text-xs hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm animate-fade-in">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-dark-border/50 text-center">
        <button
          onClick={onSwitchToRegister}
          className="text-dark-muted text-sm hover:text-brand-rose transition-colors"
        >
          Não tem conta? <span className="text-brand-rose font-medium">Criar perfil</span>
        </button>
      </div>
    </div>
  )
}

function ResetPasswordView({ onSwitchToLogin }) {
  const [handle, setHandle] = useState('@mayrabalboni')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
    if (!handle.trim() || !recoveryCode) return setStatus({ ok: false, msg: 'Informe o handle e o código de recuperação.' })
    if (password.length < 6) return setStatus({ ok: false, msg: 'A nova senha deve ter ao menos 6 caracteres.' })
    if (password !== confirm) return setStatus({ ok: false, msg: 'As senhas não coincidem.' })

    setLoading(true)
    try {
      await authApi.resetPassword({ handle: handle.trim(), recoveryCode, newPassword: password })
      setStatus({ ok: true, msg: 'Senha redefinida. Você já pode entrar.' })
      setRecoveryCode('')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setStatus({ ok: false, msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-dark-text font-editorial text-2xl mb-1">Redefinir senha</h2>
      <p className="text-dark-muted text-sm mb-6">Use o código de recuperação configurado no servidor.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">@handle</label>
          <input value={handle} onChange={e => setHandle(e.target.value)} className="input-dark" autoComplete="username" autoFocus />
        </div>
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Código de recuperação</label>
          <input type="password" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} className="input-dark" autoComplete="one-time-code" />
        </div>
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Nova senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
        </div>
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Confirmar nova senha</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-dark" autoComplete="new-password" />
        </div>

        {status && <p className={`text-sm ${status.ok ? 'text-emerald-400' : 'text-red-400'}`}>{status.msg}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
          {loading ? 'Redefinindo...' : 'Redefinir senha'}
        </button>
      </form>

      <button onClick={onSwitchToLogin} className="block mx-auto mt-4 text-dark-muted text-sm hover:text-brand-rose transition-colors">
        Voltar para o login
      </button>
    </div>
  )
}

// ─── Register form ────────────────────────────────────────────────────────────
function RegisterView({ onLogin, onSwitchToLogin }) {
  const params = new URLSearchParams(window.location.search)
  const inviteFromLink = params.get('invite') || ''
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [headerColor, setHeaderColor] = useState(HEADER_COLORS[0])
  const [inviteCode, setInviteCode] = useState(inviteFromLink)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupMode, setSignupMode] = useState(null) // null = loading

  useEffect(() => {
    getSignupMode().then(d => setSignupMode(d.mode))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Nome é obrigatório.')
    if (!handle.trim()) return setError('@handle é obrigatório.')
    if (!password) return setError('Senha é obrigatória.')
    if (password.length < 6) return setError('Senha deve ter ao menos 6 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')
    if (signupMode === 'invite_only' && !inviteCode.trim()) return setError('Código de convite é obrigatório.')

    setLoading(true)
    try {
      const data = await authApi.register({
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        password,
        headerColor,
        inviteCode: signupMode === 'invite_only' ? inviteCode.trim() : undefined,
      })
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Loading signup mode
  if (signupMode === null) {
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="w-5 h-5 rounded-full border-2 border-brand-rose border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  // Registrations disabled
  if (signupMode === 'disabled') {
    return (
      <div className="animate-fade-in text-center py-6">
        <div className="text-3xl mb-4">🔒</div>
        <h2 className="text-dark-text font-editorial text-xl mb-2">Acesso por convite</h2>
        <p className="text-dark-muted text-sm leading-relaxed mb-6">
          O Archive está disponível apenas por convite.<br />
          Entre em contato com quem te indicou.
        </p>
        <button
          onClick={onSwitchToLogin}
          className="text-dark-muted text-sm hover:text-brand-rose transition-colors"
        >
          ← Voltar para o login
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {inviteFromLink ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-brand-rose/25 bg-brand-rose/10">
          <div className="border-b border-brand-rose/15 px-5 py-4">
            <div className="mb-1 text-[11px] font-mono uppercase tracking-[0.18em] text-brand-rose/80">Convite recebido</div>
            <h2 className="font-editorial text-2xl text-dark-text">Mayra te convidou para criar seu arquivo</h2>
            <p className="mt-2 text-sm leading-relaxed text-dark-muted">
              Um espaço seu para guardar registros, fotos, projetos, estudos e memórias com controle de privacidade.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-brand-rose/10 text-center">
            {['Diário', 'Vitrine', 'Memórias'].map(item => (
              <div key={item} className="bg-black/20 px-2 py-3 text-[11px] font-mono uppercase tracking-wide text-dark-muted">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-dark-text font-editorial text-2xl mb-1">Criar perfil</h2>
          <p className="text-dark-muted text-sm mb-6">
            {signupMode === 'invite_only' ? 'Acesso por convite.' : 'Seu espaço, só seu.'}
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invite code — only when invite_only */}
        {signupMode === 'invite_only' && (
          <div>
            <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">
              Código de convite
            </label>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="input-dark"
              placeholder="Cole o código aqui"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Nome</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-dark"
            placeholder="Seu nome"
            autoFocus={signupMode !== 'invite_only'}
          />
        </div>

        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">@handle</label>
          <input
            value={handle}
            onChange={e => setHandle(e.target.value)}
            className="input-dark"
            placeholder="@seu_handle"
          />
        </div>

        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">
            Bio <span className="normal-case">(opcional)</span>
          </label>
          <input
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="input-dark"
            placeholder="Sobre você..."
          />
        </div>

        <div>
          <label className="block text-dark-muted text-xs mb-2 tracking-wide uppercase">Cor do cabeçalho</label>
          <div className="flex gap-2">
            {HEADER_COLORS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHeaderColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${headerColor === c ? 'ring-2 ring-offset-2 ring-offset-black ring-brand-rose scale-110' : 'hover:scale-110'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-dark-border/50 pt-4 space-y-4">
          <div>
            <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-dark"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input-dark"
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm animate-fade-in">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
          {loading ? 'Criando...' : 'Criar perfil'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-dark-border/50 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-dark-muted text-sm hover:text-brand-rose transition-colors"
        >
          Já tem conta? <span className="text-brand-rose font-medium">Fazer login</span>
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('view') === 'register' ? 'register' : 'login'
  })

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full avatar-gradient flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            A
          </div>
          <h1 className="font-editorial text-3xl text-dark-text tracking-tight">The Archive by Balboni</h1>
          <p className="text-dark-muted text-sm mt-1">Arquivo pessoal de ideias e memória</p>
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          {view === 'login' ? (
            <LoginView
              onLogin={onLogin}
              onSwitchToRegister={() => setView('register')}
              onSwitchToReset={() => setView('reset')}
            />
          ) : view === 'register' ? (
            <RegisterView
              onLogin={onLogin}
              onSwitchToLogin={() => setView('login')}
            />
          ) : (
            <ResetPasswordView onSwitchToLogin={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
