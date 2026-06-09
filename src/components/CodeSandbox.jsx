import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ── Runtime detection ──────────────────────────────────────────────────────────

function detectRuntime(language = '', originalName = '') {
  const lang = language.toLowerCase()
  const ext = (originalName || '').split('.').pop().toLowerCase()
  if (lang === 'python' || ext === 'py') return 'python'
  if (lang === 'html' || ext === 'html' || ext === 'htm') return 'html'
  if (['javascript', 'js', 'jsx'].includes(lang) || ['js', 'jsx'].includes(ext)) return 'javascript'
  if (['typescript', 'ts', 'tsx'].includes(lang) || ['ts', 'tsx'].includes(ext)) return 'typescript'
  return null
}

function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// ── Problematic pattern analysis ───────────────────────────────────────────────

function analyzeCode(code, runtime) {
  if (runtime !== 'python') return {}
  return {
    hasInput:      /\binput\s*\(/.test(code),
    hasOsSystem:   /\bos\.system\s*\(|\bos\.popen\s*\(/.test(code),
    hasSubprocess: /\bsubprocess\b/.test(code),
    hasClear:      /\b(clear|cls)\s*\(/.test(code),
  }
}

function isTerminalOnly(patterns) {
  return patterns.hasOsSystem || patterns.hasSubprocess || patterns.hasClear
}

// ── Error translation ─────────────────────────────────────────────────────────

function friendlyError(msg, runtime) {
  if (!msg) return 'Erro desconhecido.'
  if (/OSError.*I\/O|EOFError|StdinError|stdin/i.test(msg))
    return 'Este código usa input() que requer entrada do terminal. Use o campo "Entradas" acima para fornecer valores, um por linha.'
  if (/pyodide_unavailable|pyodide_timeout/.test(msg))
    return 'O runtime Python não conseguiu carregar neste dispositivo. Você ainda pode visualizar e copiar o código.'
  if (/Failed to fetch|NetworkError|Importing a module|importScripts/i.test(msg))
    return 'O runtime Python não conseguiu carregar neste dispositivo. Você ainda pode visualizar e copiar o código.'
  if (/Tempo limite excedido|infinite loop/i.test(msg)) return msg
  if (/ModuleNotFoundError/.test(msg)) {
    const m = msg.match(/No module named '([\w.]+)'/)
    return m
      ? `Módulo "${m[1]}" não está disponível no Sandbox. O Pyodide suporta biblioteca padrão e pacotes como numpy, pandas e requests.`
      : 'Módulo não disponível no Sandbox do navegador.'
  }
  if (/MemoryError/.test(msg)) return 'O código esgotou a memória disponível no Sandbox.'
  return msg
}

// ── Pyodide singleton ─────────────────────────────────────────────────────────

let _pyodidePromise = null
let _pyodideState = 'idle' // idle | loading | ready | failed

function getPyodide() {
  if (_pyodideState === 'failed') return Promise.reject(new Error('pyodide_unavailable'))
  if (!_pyodidePromise) {
    _pyodideState = 'loading'
    _pyodidePromise = new Promise((resolve, reject) => {
      // Timeout safety — 45 s
      const timer = setTimeout(() => {
        _pyodideState = 'failed'
        _pyodidePromise = null
        reject(new Error('pyodide_timeout'))
      }, 45000)

      const tryLoad = () => {
        window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' })
          .then(py => { clearTimeout(timer); _pyodideState = 'ready'; resolve(py) })
          .catch(err => { clearTimeout(timer); _pyodideState = 'failed'; _pyodidePromise = null; reject(err) })
      }

      if (window.loadPyodide) { tryLoad(); return }

      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'
      s.crossOrigin = 'anonymous'
      s.onload = tryLoad
      s.onerror = () => {
        clearTimeout(timer)
        _pyodideState = 'failed'
        _pyodidePromise = null
        reject(new Error('pyodide_unavailable'))
      }
      document.head.appendChild(s)
    })
  }
  return _pyodidePromise
}

// ── Python execution ──────────────────────────────────────────────────────────

async function execPython(code, stdinLines = []) {
  const pyodide = await getPyodide()

  // Pass via globals to avoid injection through template literal
  pyodide.globals.set('__sb_stdin_json', JSON.stringify(stdinLines))

  pyodide.runPython(`
import sys, builtins
from io import StringIO

__sb_out = StringIO()
__sb_err = StringIO()
sys.stdout = __sb_out
sys.stderr = __sb_err

import json as __json
__sb_inputs = iter(__json.loads(__sb_stdin_json))

def __sb_input(prompt=''):
    val = next(__sb_inputs, '')
    if prompt:
        __sb_out.write(str(prompt))
    __sb_out.write(str(val) + '\\n')
    return str(val)

builtins.input = __sb_input
`)

  let returnVal = null, error = null
  try {
    const r = pyodide.runPython(code)
    if (r !== undefined && r !== null) returnVal = String(r)
  } catch (e) {
    error = e.message
  } finally {
    try { pyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__') } catch {}
  }

  const stdout = pyodide.runPython('__sb_out.getvalue()') || ''
  const stderr = pyodide.runPython('__sb_err.getvalue()') || ''
  return { stdout, stderr, error, returnVal }
}

// ── JavaScript execution (Web Worker) ─────────────────────────────────────────

function execJS(code) {
  return new Promise(resolve => {
    const lines = []
    const workerSrc = `
self.console = {
  log:   (...a) => self.postMessage({ t: 'log', v: a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ') }),
  warn:  (...a) => self.postMessage({ t: 'warn', v: '⚠ ' + a.map(String).join(' ') }),
  error: (...a) => self.postMessage({ t: 'err', v: a.map(String).join(' ') }),
  info:  (...a) => self.postMessage({ t: 'log', v: a.map(String).join(' ') }),
}
self.onerror = (msg, _s, _l, _c, err) => {
  self.postMessage({ t: 'err', v: err ? err.message : String(msg) })
  return true
}
;(function() {
  try {
    ${code}
    self.postMessage({ t: 'done' })
  } catch (e) {
    self.postMessage({ t: 'err', v: e instanceof Error ? e.message : String(e) })
    self.postMessage({ t: 'done' })
  }
})()`
    const blob = new Blob([workerSrc], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)
    const timer = setTimeout(() => {
      worker.terminate(); URL.revokeObjectURL(url)
      resolve({ lines, error: 'Tempo limite excedido (5 s). O código pode ter um loop infinito.' })
    }, 5000)
    worker.onmessage = ({ data }) => {
      if (data.t === 'log')  lines.push({ kind: 'out',  text: data.v })
      else if (data.t === 'warn') lines.push({ kind: 'warn', text: data.v })
      else if (data.t === 'err')  lines.push({ kind: 'err',  text: data.v })
      else if (data.t === 'done') { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve({ lines }) }
    }
    worker.onerror = e => {
      clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url)
      resolve({ lines, error: e.message || 'Erro no worker JavaScript.' })
    }
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMs(ms) {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function copyText(text) {
  return navigator.clipboard.writeText(text).catch(() => {})
}

// ── Component ─────────────────────────────────────────────────────────────────

const RUNTIME_LABEL = {
  python: 'Python · Pyodide WASM',
  javascript: 'JavaScript · Web Worker',
  html: 'HTML · iframe',
  typescript: 'TypeScript',
}

export default function CodeSandbox({ code, language, originalName, onClose }) {
  const [status, setStatus] = useState('idle') // idle | loading | running | done | html
  const [output, setOutput] = useState([])
  const [stdinInput, setStdinInput] = useState('')
  const [elapsed, setElapsed] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedOut, setCopiedOut] = useState(false)
  const [htmlKey, setHtmlKey] = useState(0)
  const openedAt = useRef(Date.now())

  const runtime = detectRuntime(language, originalName)
  const patterns = analyzeCode(code, runtime)
  const terminalOnly = isTerminalOnly(patterns)
  const iosDevice = isIOS()

  function handleClose() {
    if (Date.now() - openedAt.current < 400) return
    onClose()
  }

  async function run() {
    if (status === 'loading' || status === 'running') return
    setOutput([])
    setElapsed(null)
    const t0 = Date.now()

    try {
      if (runtime === 'python') {
        setStatus('loading')
        const stdinLines = stdinInput.split('\n').map(l => l.trim()).filter(Boolean)
        const r = await execPython(code, stdinLines)
        const dt = Date.now() - t0
        setElapsed(dt)
        const lines = []
        if (r.stdout) lines.push({ kind: 'out', text: r.stdout.replace(/\n$/, '') })
        if (r.stderr) lines.push({ kind: 'err', text: r.stderr.replace(/\n$/, '') })
        if (r.error && !r.stderr) lines.push({ kind: 'err', text: friendlyError(r.error, 'python') })
        if (r.returnVal && !r.stdout) lines.push({ kind: 'ret', text: `→ ${r.returnVal}` })
        if (lines.length === 0) lines.push({ kind: 'dim', text: '(sem saída)' })
        setOutput(lines); setStatus('done')

      } else if (runtime === 'javascript') {
        setStatus('running')
        const r = await execJS(code)
        const dt = Date.now() - t0
        setElapsed(dt)
        const lines = [...r.lines]
        if (r.error) lines.push({ kind: 'err', text: friendlyError(r.error, 'javascript') })
        if (lines.length === 0) lines.push({ kind: 'dim', text: '(sem saída)' })
        setOutput(lines); setStatus('done')

      } else if (runtime === 'html') {
        setStatus('html')
      }
    } catch (e) {
      setElapsed(Date.now() - t0)
      setOutput([{ kind: 'friendly', text: friendlyError(e.message, runtime) }])
      setStatus('done')
    }
  }

  function handleCopyCode() {
    copyText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  function handleCopyOutput() {
    const text = output.map(l => l.text).join('\n')
    copyText(text)
    setCopiedOut(true)
    setTimeout(() => setCopiedOut(false), 1500)
  }

  const isRunning = status === 'loading' || status === 'running'
  const canRun = runtime && runtime !== 'html' && runtime !== 'typescript' && !terminalOnly
  const statusDot = {
    idle: '#555', loading: '#d29922', running: '#d29922',
    done: '#3fb950', html: '#58a6ff', error: '#f85149',
  }[status] ?? '#555'
  const statusLabel = {
    idle: 'pronto', loading: 'carregando Python…', running: 'executando',
    done: elapsed ? `concluído em ${fmtMs(elapsed)}` : 'concluído', html: 'renderizado',
  }[status] ?? status

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', touchAction: 'none' }}
      onClick={handleClose}
    >
      <div
        style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Title bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #30363d', background: '#161b22', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {originalName || 'código'} · {RUNTIME_LABEL[runtime] ?? 'visualização'}
          </span>
          <button
            onClick={handleClose}
            style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e', background: 'none', border: '1px solid #30363d', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
          >
            ✕ Fechar
          </button>
        </div>

        {/* ── iOS Python warning ── */}
        {runtime === 'python' && iosDevice && (
          <div style={{ padding: '10px 16px', background: '#1c1c1e', borderBottom: '1px solid #30363d', display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#8b949e', lineHeight: 1.5 }}>
              Python via WASM tem suporte limitado no Safari/iOS. Se não carregar, você ainda pode visualizar e copiar o código.
            </span>
          </div>
        )}

        {/* ── Terminal-only warning ── */}
        {terminalOnly && (
          <div style={{ padding: '10px 16px', background: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#8b949e', lineHeight: 1.5 }}>
              Este código usa <code style={{ background: '#0d1117', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>os.system()</code> ou <code style={{ background: '#0d1117', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>subprocess</code> que não são executáveis no Sandbox do navegador por segurança.
            </span>
          </div>
        )}

        {/* ── input() stdin field ── */}
        {patterns.hasInput && !terminalOnly && (
          <div style={{ padding: '10px 16px', background: '#161b22', borderBottom: '1px solid #30363d', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#58a6ff', letterSpacing: '0.06em', marginBottom: 6 }}>
              ENTRADAS SIMULADAS (stdin) — um valor por linha
            </div>
            <textarea
              value={stdinInput}
              onChange={e => setStdinInput(e.target.value)}
              placeholder="João&#10;25&#10;..."
              rows={3}
              style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--mono)', fontSize: 12, color: '#e6edf3', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* ── Output / preview area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontFamily: 'var(--mono)', fontSize: 13, minHeight: 180 }}>
          {status === 'idle' && runtime && runtime !== 'html' && !terminalOnly && (
            <p style={{ color: '#8b949e', margin: 0 }}>
              Clique em <span style={{ color: '#3fb950', fontWeight: 600 }}>▶ Executar</span> para rodar o código.
            </p>
          )}
          {status === 'idle' && runtime === 'html' && (
            <p style={{ color: '#8b949e', margin: 0 }}>
              Clique em <span style={{ color: '#58a6ff', fontWeight: 600 }}>▶ Renderizar</span> para visualizar.
            </p>
          )}
          {status === 'idle' && terminalOnly && (
            <p style={{ color: '#8b949e', margin: 0 }}>Visualize e copie o código acima.</p>
          )}
          {status === 'idle' && runtime === 'typescript' && (
            <div>
              <p style={{ color: '#f85149', margin: '0 0 4px' }}>TypeScript requer transpilação.</p>
              <p style={{ color: '#8b949e', margin: 0, fontSize: 11 }}>Converta para .js ou cole o código compilado para executar.</p>
            </div>
          )}
          {status === 'idle' && !runtime && (
            <div>
              <p style={{ color: '#8b949e', margin: '0 0 4px' }}>Tipo de arquivo não executável no navegador.</p>
              <p style={{ color: '#555', margin: 0, fontSize: 11 }}>Suportado: Python (.py), JavaScript (.js .jsx), HTML (.html)</p>
            </div>
          )}

          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8b949e' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #58a6ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span>{status === 'loading' ? 'Carregando Python (WASM)…' : 'Executando…'}</span>
            </div>
          )}

          {status === 'html' && (
            <iframe
              key={htmlKey}
              sandbox="allow-scripts"
              srcDoc={code}
              title="HTML Sandbox"
              style={{ width: '100%', height: 380, background: '#fff', border: '1px solid #30363d', borderRadius: 8 }}
            />
          )}

          {status === 'done' && output.map((line, i) => (
            <div key={i} style={{
              lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              color: line.kind === 'err' ? '#f85149'
                : line.kind === 'warn' ? '#d29922'
                : line.kind === 'ret'  ? '#79c0ff'
                : line.kind === 'dim'  ? '#8b949e'
                : line.kind === 'friendly' ? '#d29922'
                : '#e6edf3',
              fontStyle: line.kind === 'friendly' ? 'normal' : undefined,
              fontFamily: line.kind === 'friendly' ? 'var(--sans)' : undefined,
              fontSize: line.kind === 'friendly' ? 13 : undefined,
              background: line.kind === 'friendly' ? 'rgba(210,153,34,0.06)' : undefined,
              borderLeft: line.kind === 'friendly' ? '3px solid #d29922' : undefined,
              padding: line.kind === 'friendly' ? '6px 10px' : undefined,
              borderRadius: line.kind === 'friendly' ? 6 : undefined,
            }}>
              {line.text}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 16px', borderTop: '1px solid #30363d', background: '#161b22', flexShrink: 0, flexWrap: 'wrap' }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e' }}>{statusLabel}</span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* Copy code */}
            <button
              onClick={handleCopyCode}
              style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e', background: 'none', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
            >
              {copiedCode ? '✓ Copiado' : 'Copiar código'}
            </button>

            {/* Copy output */}
            {status === 'done' && output.length > 0 && (
              <button
                onClick={handleCopyOutput}
                style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e', background: 'none', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
              >
                {copiedOut ? '✓ Copiado' : 'Copiar saída'}
              </button>
            )}

            {/* Clear output */}
            {status === 'done' && (
              <button
                onClick={() => { setStatus('idle'); setOutput([]); setElapsed(null) }}
                style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e', background: 'none', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
              >
                Limpar
              </button>
            )}

            {/* HTML reload */}
            {status === 'html' && (
              <button
                onClick={() => setHtmlKey(k => k + 1)}
                style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, color: '#8b949e', background: 'none', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
              >
                ↺ Reiniciar
              </button>
            )}

            {/* Run */}
            {canRun && (
              <button
                onClick={run}
                disabled={isRunning}
                style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#fff', background: isRunning ? '#1e3a1e' : '#238636', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: isRunning ? 'wait' : 'pointer', opacity: isRunning ? 0.6 : 1 }}
              >
                {isRunning ? 'Executando…' : status === 'done' ? '▶ Executar novamente' : '▶ Executar'}
              </button>
            )}

            {/* HTML render */}
            {runtime === 'html' && (
              <button
                onClick={run}
                style={{ touchAction: 'manipulation', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: '#fff', background: '#1f6feb', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer' }}
              >
                {status === 'html' ? '↺ Recarregar' : '▶ Renderizar'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>,
    document.body
  )
}
