import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'

export const CODE_LANGUAGES = [
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['jsx', 'React JSX'],
  ['tsx', 'React TSX'],
  ['python', 'Python'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['json', 'JSON'],
  ['bash', 'Shell / Bash'],
  ['sql', 'SQL'],
  ['markdown', 'Markdown'],
  ['java', 'Java'],
  ['c', 'C'],
  ['cpp', 'C++'],
  ['csharp', 'C#'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['plaintext', 'Texto'],
]

const aliases = { html: 'markup' }

export function highlightCode(code, language) {
  const prismLanguage = aliases[language] || language
  const grammar = Prism.languages[prismLanguage] || Prism.languages.plaintext || Prism.languages.clike
  if (!grammar) return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return Prism.highlight(code, grammar, prismLanguage)
}

export function languageLabel(language) {
  return CODE_LANGUAGES.find(([id]) => id === language)?.[1] || language
}
