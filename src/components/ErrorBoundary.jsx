import { Component } from 'react'

function isStaleAssetError(error) {
  const msg = error?.toString?.() ?? ''
  return (
    msg.includes('not a valid JavaScript MIME type') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  )
}

async function clearSwAndReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch {}
  window.location.reload(true)
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[ErrorBoundary] caught:', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      const { error, info } = this.state
      const isStale = isStaleAssetError(error)

      if (isStale) {
        return (
          <div style={{
            minHeight: '100dvh', background: '#000', color: '#f2ede6',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 20, opacity: 0.4 }}>⟳</div>
            <h2 style={{ margin: '0 0 10px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 22, color: '#f2ede6' }}>
              Nova versão disponível
            </h2>
            <p style={{ margin: '0 0 28px', fontFamily: 'system-ui, sans-serif', fontSize: 14, color: '#aba49a', lineHeight: 1.6, maxWidth: 300 }}>
              O app foi atualizado. Clique abaixo para carregar a versão mais recente.
            </p>
            <button
              onClick={clearSwAndReload}
              style={{
                padding: '13px 28px', borderRadius: 12, border: 'none',
                background: '#e86cb4', color: '#fff', cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif', fontSize: 15, fontWeight: 600,
              }}
            >
              Atualizar app
            </button>
          </div>
        )
      }

      return (
        <div style={{
          minHeight: '100dvh', background: '#000', color: '#f2ede6',
          fontFamily: 'monospace', fontSize: 13, padding: '32px 20px',
          overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          <div style={{ color: '#e86cb4', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            ✗ Erro de renderização
          </div>
          <div style={{ color: '#f87171', marginBottom: 12 }}>
            {error?.toString?.() || String(error)}
          </div>
          {error?.stack && (
            <div style={{ color: '#6c665e', marginBottom: 12 }}>
              {error.stack}
            </div>
          )}
          {info?.componentStack && (
            <div style={{ color: '#aba49a', marginBottom: 20 }}>
              {info.componentStack}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => this.setState({ error: null, info: null })}
              style={{
                padding: '10px 20px', border: '1px solid #333',
                background: 'transparent', color: '#f2ede6', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 13, borderRadius: 8,
              }}
            >
              Tentar novamente
            </button>
            <button
              onClick={clearSwAndReload}
              style={{
                padding: '10px 20px', border: '1px solid #e86cb4',
                background: 'transparent', color: '#e86cb4', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 13, borderRadius: 8,
              }}
            >
              Limpar cache e recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
