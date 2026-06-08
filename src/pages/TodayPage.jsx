import { useEffect, useState } from 'react'
import { api } from '../utils/api'

export default function TodayPage() {
  const [data, setData] = useState(null)

  useEffect(() => { api.get('/archive/today').then(setData) }, [])

  if (!data) return <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" /></div>

  const stats = [
    ['Posts', data.posts_today],
    ['Artigos', data.articles_today],
    ['Códigos', data.codes_today],
    ['PDFs', data.pdfs_today],
    ['Imagens', data.images_today],
    ['Dias ativos', data.active_days],
  ]

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Painel pessoal</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">Hoje</h1>
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
          <p className="text-dark-muted text-xs">Última atividade</p>
          <p className="text-dark-text mt-1">{data.latest?.article_title || data.latest?.content || 'Nenhuma atividade ainda.'}</p>
        </div>
        <div className="rounded-lg border border-dark-border bg-dark-card p-4">
          <p className="text-dark-muted text-xs">Coleção mais usada</p>
          <p className="text-dark-text mt-1">{data.topCollection?.name || 'Sem coleção dominante'}</p>
        </div>
      </section>
    </div>
  )
}
