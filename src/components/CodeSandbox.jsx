import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function detectRuntime(language = '', originalName = '') {
  const lang = language.toLowerCase()
  const ext = (originalName || '').split('.').pop().toLowerCase()
  if (lang === 'python' || ext === 'py') return 'python'
  if (lang === 'html' || ext === 'html' || ext === 'htm') return 'html'
  if (['javascript', 'js', 'jsx'].includes(lang) || ['js', 'jsx'].includes(ext)) return 'javascript'
  if (['typescript', 'ts', 'tsx'].includes(lang) || ['ts', 'tsx'].includes(ext)) return 'typescript'
  return null
}

// Pyodide singleton — loaded once, reused across calls
let _pyodidePromise = null

function getPyodide() {
  if (!_pyodidePromise) {
    _pyodidePromise = new Promise((resolve, reject) => {
      if (window.loadPyodide) { window.loadPyodide().then(resolve).catch(reject); return }
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'
      s.onload = () => window.loadPyodide().then(resolve).catch(reject)
      s.onerror = () => reject(new Error('Falha ao carregar Pyodide'))
      document.head.appendChild(s)
    })
  }
  return _pyodidePromise
}

async function execPython(code) {
  const pyodide = await getPyodide()
  pyodide.runPython(`
import sys
from io import StringIO
__sb_out = StringIO()
__sb_err = StringIO()
sys.stdout = __sb_out
sys.stderr = __sb_err
`)
  let returnVal = null
  let error = null
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

function execJS(code) {
  return new Promise(resolve => {
    const lines = []
    const workerSrc = `
self.console = {
  log:  (...a) => self.postMessage({ t: 'log', v: a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ') }),
  warn: (...a) => self.postMessage({ t: 'log', v: 'WARN: ' + a.map(String).join(' ') }),
  error:(...a) => self.postMessage({ t: 'err', v: a.map(String).join(' ') }),
  info: (...a) => self.postMessage({ t: 'log', v: a.map(String).join(' ') }),
}
self.onerror = (msg, _s, _l, _c, err) => { self.postMessage({ t: 'err', v: err ? err.message : msg }); return true }
;(function(){
  try { ${code}; self.postMessage({ t: 'done' }) }
  catch(e) { self.postMessage({ t: 'err', v: e.message }); self.postMessage({ t: 'done' }) }
})()`
    const blob = new Blob([workerSrc], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)
    const timer = setTimeout(() => {
      worker.terminate(); URL.revokeObjectURL(url)
      resolve({ lines, error: 'Tempo limite excedido (5 s). O código pode ter um loop infinito.' })
    }, 5000)
    worker.onmessage = ({ data }) => {
      if (data.t === 'log') lines.push({ kind: 'out', text: data.v })
      else if (data.t === 'err') lines.push({ kind: 'err', text: data.v })
      else if (data.t === 'done') { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve({ lines }) }
    }
    worker.onerror = e => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve({ lines, error: e.message || 'Erro no worker' }) }
  })
}

const RUNTIME_LABEL = { python: 'Python · Pyodide WASM', javascript: 'JavaScript · Web Worker', html: 'HTML · iframe sandbox', typescript: 'TypeScript', null: 'Não suportado' }

export default function CodeSandbox({ code, language, originalName, onClose }) {
  const [status, setStatus] = useState('idle') // idle | loading | running | done | html | error
  const [output, setOutput] = useState([])
  const [loadMsg, setLoadMsg] = useState('')
  const openedAt = useRef(Date.now())

  const runtime = detectRuntime(language, originalName)
  const label = RUNTIME_LABEL[runtime] ?? 'Não suportado'

  function handleClose() {
    if (Date.now() - openedAt.current < 400) return
    onClose()
  }

  async function run() {
    setOutput([])
    try {
      if (runtime === 'python') {
        setStatus('loading')
        setLoadMsg('Carregando Pyodide (Python via WASM)…')
        const r = await execPython(code)
        const lines = []
        if (r.stdout) lines.push({ kind: 'out', text: r.stdout })
        if (r.stderr) lines.push({ kind: 'err', text: r.stderr })
        if (r.error && !r.stderr) lines.push({ kind: 'err', text: r.error })
        if (r.returnVal && !r.stdout) lines.push({ kind: 'ret', text: `→ ${r.returnVal}` })
        if (lines.length === 0) lines.push({ kind: 'dim', text: '(sem saída)' })
        setOutput(lines); setStatus('done')
      } else if (runtime === 'javascript') {
        setStatus('running')
        const r = await execJS(code)
        const lines = [...r.lines]
        if (r.error) lines.push({ kind: 'err', text: r.error })
        if (lines.length === 0) lines.push({ kind: 'dim', text: '(sem saída)' })
        setOutput(lines); setStatus('done')
      } else if (runtime === 'html') {
        setStatus('html')
      }
    } catch (e) {
      setOutput([{ kind: 'err', text: e.message }]); setStatus('done')
    }
  }

  const dot = status === 'done' ? '#3fb950' : (status === 'loading' || status === 'running') ? '#d29922' : '#444c56'
  const statusLabel = { idle: 'pronto', loading: 'carregando', running: 'executando', done: 'concluído', html: 'renderizado', error: 'erro' }[status] ?? status

  return createPortal(
    <div
      className="fixed inset-0 bg-black/92 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      style={{ zIndex: 999, touchAction: 'none' }}
      onClick={handleClose}
    >
      <div
        className="bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[#8b949e] text-xs font-mono truncate flex-1">{originalName || 'código'} · {label}</span>
          <button
            style={{ touchAction: 'manipulation' }}
            onClick={handleClose}
            className="text-[#8b949e] hover:text-white text-xs px-2 py-1 rounded border border-[#30363d] hover:border-[#555] shrink-0"
          >
            Fechar
          </button>
        </div>

        {/* Output */}
        <div className="flex-1 overflow-auto p-4 font-mono text-sm min-h-[180px]">
          {status === 'idle' && runtime && runtime !== 'html' && (
            <p className="text-[#8b949e]">Clique em <span className="text-[#3fb950] font-semibold">▶ Executar</span> para rodar o código.</p>
          )}
          {status === 'idle' && runtime === 'html' && (
            <p className="text-[#8b949e]">Clique em <span className="text-[#58a6ff] font-semibold">▶ Renderizar</span> para visualizar o HTML.</p>
          )}
          {status === 'idle' && !runtime && (
            <div>
              <p className="text-[#f85149]">Este tipo de arquivo não pode ser executado no navegador.</p>
              <p className="text-[#8b949e] mt-1 text-xs">Suportado: Python (.py), JavaScript (.js .jsx), HTML (.html)</p>
              {runtime === 'typescript' && <p className="text-[#8b949e] mt-1 text-xs">TypeScript precisa de transpilação — tente converter para .js antes.</p>}
            </div>
          )}
          {(status === 'loading' || status === 'running') && (
            <div className="flex items-center gap-3 text-[#8b949e]">
              <div className="w-4 h-4 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{status === 'loading' ? loadMsg : 'Executando…'}</span>
            </div>
          )}
          {status === 'html' && (
            <iframe
              sandbox="allow-scripts"
              srcDoc={code}
              title="HTML Sandbox"
              className="w-full rounded border border-[#30363d]"
              style={{ height: 380, background: '#fff' }}
            />
          )}
          {status === 'done' && output.map((line, i) => (
            <div
              key={i}
              className={`leading-relaxed whitespace-pre-wrap break-words ${
                line.kind === 'err' ? 'text-[#f85149]' :
                line.kind === 'ret' ? 'text-[#79c0ff]' :
                line.kind === 'dim' ? 'text-[#8b949e]' :
                'text-[#e6edf3]'
              }`}
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
            <span className="text-[#8b949e] text-xs font-mono">{statusLabel}</span>
          </div>
          <div className="flex gap-2">
            {status === 'done' && (
              <button
                style={{ touchAction: 'manipulation' }}
                onClick={() => { setStatus('idle'); setOutput([]) }}
                className="text-[#8b949e] text-xs px-3 py-1.5 rounded border border-[#30363d] hover:border-[#555]"
              >
                Limpar
              </button>
            )}
            {runtime && runtime !== 'html' && runtime !== 'typescript' && (
              <button
                style={{ touchAction: 'manipulation' }}
                onClick={run}
                disabled={status === 'loading' || status === 'running'}
                className="text-white text-xs font-semibold px-4 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-wait"
              >
                {(status === 'loading' || status === 'running') ? 'Executando…' : '▶ Executar'}
              </button>
            )}
            {runtime === 'html' && (
              <button
                style={{ touchAction: 'manipulation' }}
                onClick={run}
                className="text-white text-xs font-semibold px-4 py-1.5 rounded bg-[#1f6feb] hover:bg-[#388bfd]"
              >
                {status === 'html' ? '↺ Recarregar' : '▶ Renderizar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
