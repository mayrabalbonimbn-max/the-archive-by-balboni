import { useState } from 'react'
import { highlightCode, languageLabel } from '../utils/codeHighlight'
import CodeSandbox from './CodeSandbox'

const RUNNABLE = ['python', 'javascript', 'js', 'html', 'jsx']

export default function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)
  const [sandbox, setSandbox] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const canRun = RUNNABLE.includes((language || '').toLowerCase())

  return (
    <>
      <div className="mt-2.5 rounded-2xl overflow-hidden border border-[#30363d] bg-[#0d1117] text-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2 text-[#8b949e] text-xs">{languageLabel(language)}</span>
          </div>
          <div className="flex items-center gap-3">
            {canRun && (
              <button
                onClick={() => setSandbox(true)}
                style={{ touchAction: 'manipulation' }}
                className="text-xs text-[#3fb950] hover:text-[#56d364] transition-colors font-medium"
              >
                ▶ Executar
              </button>
            )}
            <button onClick={copyCode} className="text-xs text-[#8b949e] hover:text-white transition-colors">
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <pre className="overflow-x-auto p-4 leading-relaxed font-mono text-[13px] whitespace-pre tab-4">
          <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
        </pre>
      </div>
      {sandbox && <CodeSandbox code={code} language={language} originalName="" onClose={() => setSandbox(false)} />}
    </>
  )
}
