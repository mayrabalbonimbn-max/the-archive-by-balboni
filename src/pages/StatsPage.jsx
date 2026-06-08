import { useEffect, useState } from 'react'
import { api } from '../utils/api'

export default function StatsPage() {
  const [data, setData] = useState(null)

  useEffect(() => { api.get('/archive/stats').then(setData) }, [])

  if (!data) return <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" /></div>

  const stats = [
    ['Posts', data.posts],
    ['Artigos', data.articles],
    ['Códigos', data.codes],
    ['PDFs', data.pdfs],
    ['Imagens', data.images],
    ['Dias ativos', data.active_days],
  ]

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Arquivo em números</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">Estatísticas</h1>
      </div>
      <section className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-dark-border bg-dark-card p-4">
            <p className="text-2xl font-bold text-dark-text">{value || 0}</p>
            <p className="text-dark-muted text-xs mt-1">{label}</p>
          </div>
        ))}
      </section>
      <section className="px-4 pb-5 space-y-3">
        <div className="rounded-lg border border-dark-border bg-dark-card p-4">
          <p className="text-dark-muted text-xs">Primeira publicação</p>
          <p className="text-dark-text mt-1">{data.first_post ? new Date(data.first_post).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Ainda sem publicações'}</p>
        </div>
        <div className="rounded-lg border border-dark-border bg-dark-card p-4">
          <p className="text-dark-muted text-xs">Coleção mais usada</p>
          <p className="text-dark-text mt-1">{data.topCollection?.name || 'Sem coleção dominante'}</p>
        </div>
        <div className="rounded-lg border border-dark-border bg-dark-card p-4">
          <p className="text-dark-muted text-xs mb-3">Tags mais usadas</p>
          <div className="flex flex-wrap gap-2">
            {(data.topTags || []).map(item => (
              <span key={item.tag} className="pill-badge bg-dark-hover border border-dark-border text-dark-muted">#{item.tag} · {item.count}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
