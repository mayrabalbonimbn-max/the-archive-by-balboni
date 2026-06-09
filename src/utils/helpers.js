// Returns /@handle (stripping any leading @) or /profiles/:id as fallback
export function profileUrl(handleOrProfile, id) {
  const handle = typeof handleOrProfile === 'object'
    ? (handleOrProfile?.handle ?? handleOrProfile?.username)
    : handleOrProfile
  const fallbackId = typeof handleOrProfile === 'object' ? (id ?? handleOrProfile?.id) : id
  if (handle) return `/@${handle.replace(/^@+/, '')}`
  if (fallbackId) return `/profiles/${fallbackId}`
  return '/explore'
}

export function formatRelativeTime(isoString) {
  const now = new Date()
  const date = new Date(isoString)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)}d`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export function formatFullDate(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const TYPE_CONFIG = {
  pensamento:  { label: 'Pensamento', color: 'bg-sky-500/10 text-sky-300/90 border border-sky-500/20' },
  diário:      { label: 'Diário',     color: 'bg-rose-500/10 text-rose-300/90 border border-rose-500/20' },
  ideia:       { label: 'Ideia',      color: 'bg-amber-500/10 text-amber-300/90 border border-amber-500/20' },
  desabafo:    { label: 'Desabafo',   color: 'bg-red-500/10 text-red-300/90 border border-red-500/20' },
  trabalho:    { label: 'Trabalho',   color: 'bg-emerald-500/10 text-emerald-300/90 border border-emerald-500/20' },
  estudo:      { label: 'Estudo',     color: 'bg-violet-500/10 text-violet-300/90 border border-violet-500/20' },
  código:      { label: 'Código',      color: 'bg-cyan-500/10 text-cyan-300/90 border border-cyan-500/20' },
  fotografia:  { label: 'Fotografia', color: 'bg-fuchsia-500/10 text-fuchsia-300/90 border border-fuchsia-500/20' },
  aleatório:   { label: 'Aleatório',  color: 'bg-zinc-500/10 text-zinc-400/90 border border-zinc-500/20' },
}

export const POST_TYPES = Object.keys(TYPE_CONFIG)

export const CATEGORIA_CONFIG = {
  pensamento:  { label: 'Pensamento',  color: 'bg-pink-500/10 text-pink-300/90 border border-pink-500/20' },
  reflexão:    { label: 'Reflexão',    color: 'bg-blue-500/10 text-blue-300/90 border border-blue-500/20' },
  ideia:       { label: 'Ideia',       color: 'bg-green-500/10 text-green-300/90 border border-green-500/20' },
  aprendizado: { label: 'Aprendizado', color: 'bg-cyan-500/10 text-cyan-300/90 border border-cyan-500/20' },
  decisão:     { label: 'Decisão',     color: 'bg-amber-500/10 text-amber-300/90 border border-amber-500/20' },
  observação:  { label: 'Observação',  color: 'bg-purple-500/10 text-purple-300/90 border border-purple-500/20' },
  memória:     { label: 'Memória',     color: 'bg-yellow-500/10 text-yellow-300/90 border border-yellow-500/20' },
  citação:     { label: 'Citação',     color: 'bg-zinc-500/10 text-zinc-300/90 border border-zinc-500/20' },
  meta:        { label: 'Meta',        color: 'bg-emerald-500/10 text-emerald-300/90 border border-emerald-500/20' },
}
