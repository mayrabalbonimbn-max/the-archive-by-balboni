import { useState } from 'react'
import { authApi } from '../utils/api'

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
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [headerColor, setHeaderColor] = useState(HEADER_COLORS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Nome é obrigatório.')
    if (!handle.trim()) return setError('@handle é obrigatório.')
    if (!password) return setError('Senha é obrigatória.')
    if (password.length < 6) return setError('Senha deve ter ao menos 6 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')

    setLoading(true)
    try {
      const data = await authApi.register({
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        password,
        headerColor,
      })
      onLogin(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-dark-text font-editorial text-2xl mb-1">Criar perfil</h2>
      <p className="text-dark-muted text-sm mb-6">Seu espaço, só seu.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-dark-muted text-xs mb-1.5 tracking-wide uppercase">Nome</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-dark"
            placeholder="Seu nome"
            autoFocus
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
  const [view, setView] = useState('login')

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
