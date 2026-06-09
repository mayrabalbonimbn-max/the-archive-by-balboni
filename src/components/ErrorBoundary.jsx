import { Component } from 'react'

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
      return (
        <div style={{
          minHeight: '100dvh', background: '#000', color: '#f2ede6',
          fontFamily: 'monospace', fontSize: 13, padding: '32px 20px',
          overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          <div style={{ color: '#e86cb4', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            ✗ Erro de renderização — copie e envie para debug
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
            <div style={{ color: '#aba49a' }}>
              {info.componentStack}
            </div>
          )}
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              marginTop: 24, padding: '10px 20px', border: '1px solid #333',
              background: 'transparent', color: '#f2ede6', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 13, borderRadius: 8,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
