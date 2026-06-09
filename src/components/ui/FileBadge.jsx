import Icon from './Icon'

const KIND_ICON = {
  PDF: 'pdf', pdf: 'pdf',
  PY: 'code', py: 'code', Python: 'code', code: 'code', CODE: 'code',
  MD: 'markdown', md: 'markdown', Markdown: 'markdown', markdown: 'markdown',
}

export default function FileBadge({ kind = 'note', tone }) {
  const icon = KIND_ICON[kind] ?? 'note'
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 9, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--line-strong)',
      color: tone ?? 'var(--ink-2)',
    }}>
      <Icon name={icon} size={20} />
    </div>
  )
}
