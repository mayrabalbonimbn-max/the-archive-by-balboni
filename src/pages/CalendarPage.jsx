import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import ArchiveMiniCard from '../components/ArchiveMiniCard'

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function CalendarPage() {
  const [months, setMonths] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => { api.get('/archive/calendar').then(setMonths) }, [])

  async function openMonth(monthIso) {
    setSelected(monthIso)
    setDetail(null)
    const date = new Date(monthIso)
    setDetail(await api.get(`/archive/calendar/${date.getFullYear()}/${date.getMonth() + 1}`))
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">Diário digital</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">Calendário da Vida</h1>
      </div>
      <div className="p-4 grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {!months ? <p className="text-dark-muted text-sm">Carregando...</p> : months.map(month => (
            <button key={month.month} onClick={() => openMonth(month.month)} className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${selected === month.month ? 'border-brand-rose bg-brand-rose/10 text-dark-text' : 'border-dark-border bg-dark-card text-dark-muted hover:text-dark-text'}`}>
              {monthLabel(month.month)}
              <span className="float-right">{month.count}</span>
            </button>
          ))}
        </aside>
        <section className="space-y-3">
          {!selected ? (
            <div className="rounded-lg border border-dark-border bg-dark-card p-6 text-dark-muted text-sm">Escolha um mês para revisitar.</div>
          ) : !detail ? (
            <div className="py-10 text-dark-muted text-sm">Carregando mês...</div>
          ) : (
            <>
              <h2 className="text-dark-text font-semibold capitalize">{monthLabel(selected)}</h2>
              {[...detail.posts, ...detail.files.map(file => ({ ...file, itemType: file.fileType }))].map(item => (
                <ArchiveMiniCard key={`${item.itemType}-${item.id}`} item={item} />
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
