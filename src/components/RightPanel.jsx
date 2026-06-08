import { useMemo } from 'react'
import { TYPE_CONFIG } from '../utils/helpers'

function daysSince(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  return Math.floor(diff / 86400000)
}

export default function RightPanel({ posts, onSearch, searchQuery }) {
  const stats = useMemo(() => {
    const total = posts.length
    const liked = posts.filter(p => p.liked).length
    const saved = posts.filter(p => p.saved).length
    const diary = posts.filter(p => p.isDiary).length
    const oldest = posts.length > 0
      ? posts.reduce((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? a : b)
      : null
    const daysActive = oldest ? daysSince(oldest.createdAt) + 1 : 0
    const thisWeek = posts.filter(p => daysSince(p.createdAt) < 7).length
    const byType = Object.keys(TYPE_CONFIG)
      .map(type => ({ type, count: posts.filter(p => p.type === type).length, ...TYPE_CONFIG[type] }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
    return { total, liked, saved, diary, daysActive, thisWeek, byType }
  }, [posts])

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[300px] xl:w-[340px] shrink-0 sticky top-0 h-screen overflow-y-auto scrollbar-hide py-5 pr-4 pl-2">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar nas entradas..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-full pl-9 pr-4 py-2 text-[13px] text-dark-text placeholder-dark-label/80 focus:border-brand-rose/50 focus:bg-dark-card2 transition-all duration-200"
        />
      </div>

      {/* Stats */}
      <div className="bg-dark-card border border-dark-border/70 rounded-2xl p-4 space-y-4">
        <h3 className="font-semibold text-dark-text text-sm tracking-tight">Meu espaço</h3>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-dark-hover">
            <p className="text-[22px] font-bold text-dark-text leading-none">{stats.total}</p>
            <p className="text-[11px] text-dark-muted mt-1 tracking-wide">entradas</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-hover">
            <p className="text-[22px] font-bold text-brand-rose leading-none">{stats.liked}</p>
            <p className="text-[11px] text-dark-muted mt-1 tracking-wide">apreciados</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-hover">
            <p className="text-[22px] font-bold text-brand-rose/80 leading-none">{stats.saved}</p>
            <p className="text-[11px] text-dark-muted mt-1 tracking-wide">salvos</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-hover">
            <p className="text-[22px] font-bold text-brand-violet/80 leading-none">{stats.diary}</p>
            <p className="text-[11px] text-dark-muted mt-1 tracking-wide">no diário</p>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="border-t border-dark-border/50 pt-3 space-y-2">
            {stats.daysActive > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-dark-muted">Dias escrevendo</span>
                <span className="text-dark-text font-medium tabular-nums">{stats.daysActive}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-dark-muted">Esta semana</span>
              <span className="text-dark-text font-medium tabular-nums">{stats.thisWeek}</span>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      {stats.byType.length > 0 && (
        <div className="bg-dark-card border border-dark-border/70 rounded-2xl p-4">
          <h3 className="font-semibold text-dark-text text-sm tracking-tight mb-3">Categorias</h3>
          <div className="space-y-2.5">
            {stats.byType.map(({ type, label, color, count }) => (
              <div key={type} className="flex items-center justify-between">
                <span className={`pill-badge ${color}`}>{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-dark-hover overflow-hidden">
                    <div
                      className="h-full rounded-full bg-dark-muted/50 transition-all duration-500"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-dark-muted text-[12px] tabular-nums w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-dark-label text-[11px] px-1 mt-auto tracking-wide">
        The Archive by Balboni
      </p>
    </aside>
  )
}
