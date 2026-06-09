import Icon from './Icon'

const TYPE_MAP = {
  note:      { label: 'Nota',       icon: 'note' },
  pensamento:{ label: 'Nota',       icon: 'note' },
  reflexão:  { label: 'Nota',       icon: 'note' },
  aleatório: { label: 'Nota',       icon: 'note' },
  article:   { label: 'Artigo',     icon: 'feather' },
  estudo:    { label: 'Estudo',     icon: 'feather' },
  leitura:   { label: 'Leitura',    icon: 'library' },
  photo:     { label: 'Fotografia', icon: 'image' },
  arte:      { label: 'Arte',       icon: 'image' },
  pdf:       { label: 'Documento',  icon: 'pdf' },
  code:      { label: 'Código',     icon: 'code' },
  link:      { label: 'Link',       icon: 'link' },
}

export default function TypeTag({ type = 'note' }) {
  const { label, icon } = TYPE_MAP[type] ?? TYPE_MAP.note
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--mono)', fontSize: 10.5,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--ink-3)', flexShrink: 0,
    }}>
      <Icon name={icon} size={13} />
      {label}
    </span>
  )
}
