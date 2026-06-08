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
