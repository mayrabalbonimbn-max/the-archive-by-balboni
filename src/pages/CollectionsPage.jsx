import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCollections } from '../hooks/useCollections'

const PRESET_EMOJIS = ['📁', '🐍', '📷', '📔', '👨‍👩‍👧‍👦', '🎓', '💡', '🎨', '📚', '🌱', '🔬', '✍️', '🎵', '🏃']
const PRESET_COLORS = [
  '#6366f1', '#f472b6', '#10b981', '#f59e0b',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
  '#f97316', '#06b6d4',
]
const PRESETS = [
  { name: 'Python', emoji: '🐍', color: '#3b82f6' },
  { name: 'Fotografia', emoji: '📷', color: '#f472b6' },
  { name: 'Diário', emoji: '📔', color: '#f59e0b' },
  { name: 'Balboni', emoji: '👨‍👩‍👧‍👦', color: '#10b981' },
  { name: 'Faculdade', emoji: '🎓', color: '#8b5cf6' },
]

function CollectionCard({ collection, onClick, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div
      className="group relative border border-dark-border rounded-2xl p-5 cursor-pointer hover:border-dark-muted/50 transition-all duration-200 hover:bg-dark-hover/40 animate-fade-in"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: collection.color + '22', border: `1.5px solid ${collection.color}44` }}
        >
          {collection.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-dark-text truncate">{collection.name}</h3>
          <p className="text-dark-muted text-sm mt-0.5">{collection.postCount} {collection.postCount === 1 ? 'post' : 'posts'}</p>
        </div>
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: collection.color }}
        />
      </div>
      <button
        onClick={e => {
          e.stopPropagation()
          if (confirmDelete) { onDelete(collection.id) }
          else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }
        }}
        className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-xs font-medium ${confirmDelete ? 'text-red-400 bg-red-500/10' : 'text-dark-muted hover:text-red-400 hover:bg-dark-hover'}`}
      >
        {confirmDelete ? 'confirmar?' : '×'}
      </button>
    </div>
  )
}

function NewCollectionModal({ onClose, onCreate, existingNames }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [color, setColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return setError('Nome obrigatório.')
    if (existingNames.includes(trimmed.toLowerCase())) return setError('Essa coleção já existe.')
    setSaving(true)
    try {
      await onCreate({ name: trimmed, emoji, color })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-sm animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-bold text-dark-text text-lg mb-5">Nova coleção</h2>

        <div className="mb-4">
          <label className="block text-dark-muted text-xs mb-1.5 uppercase tracking-wide">Emoji</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg transition-all ${emoji === e ? 'bg-dark-hover ring-1 ring-brand-rose scale-110' : 'hover:bg-dark-hover'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-dark-muted text-xs mb-1.5 uppercase tracking-wide">Cor</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-offset-dark-card ring-brand-rose scale-110' : 'hover:scale-110'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-dark-muted text-xs mb-1.5 uppercase tracking-wide">Nome</label>
          <input
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="input-dark"
            placeholder="ex: Projetos Pessoais"
            maxLength={100}
          />
          {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-dark-border text-dark-muted px-4 py-2 rounded-xl text-sm hover:bg-dark-hover transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="flex-1 btn-primary text-sm"
            style={{ background: color }}
          >
            {saving ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CollectionsPage() {
  const navigate = useNavigate()
  const { collections, loading, createCollection, deleteCollection } = useCollections()
  const [showModal, setShowModal] = useState(false)

  const existingNames = collections.map(c => c.name.toLowerCase())

  async function handlePreset(preset) {
    if (existingNames.includes(preset.name.toLowerCase())) return
    await createCollection(preset)
  }

  const missingPresets = PRESETS.filter(p => !existingNames.includes(p.name.toLowerCase()))

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-xl text-dark-text">Coleções</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm px-4 py-1.5">
          + Nova
        </button>
      </div>

      <div className="px-4 py-5">
        {missingPresets.length > 0 && (
          <div className="mb-6">
            <p className="text-dark-muted text-xs uppercase tracking-wide mb-3">Sugestões</p>
            <div className="flex flex-wrap gap-2">
              {missingPresets.map(p => (
                <button
                  key={p.name}
                  onClick={() => handlePreset(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dark-border text-dark-muted text-sm hover:border-dark-muted/60 hover:text-dark-text transition-all"
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                  <span className="text-dark-label text-xs">+</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-dark-text/60 font-medium">Nenhuma coleção ainda</p>
            <p className="text-dark-muted text-sm mt-1">Organize seus posts por temas e projetos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {collections.map(col => (
              <CollectionCard
                key={col.id}
                collection={col}
                onClick={() => navigate(`/collections/${col.id}`)}
                onDelete={deleteCollection}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewCollectionModal
          onClose={() => setShowModal(false)}
          onCreate={createCollection}
          existingNames={existingNames}
        />
      )}
    </div>
  )
}
