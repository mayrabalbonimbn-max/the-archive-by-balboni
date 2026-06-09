import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

const NODE_COLORS = {
  post: 'rgba(255,255,255,0.6)',
  article: '#7AA2F7',
  project: '#E86CB4',
  collection: '#73DACA',
  tag: 'rgba(255,255,255,0.25)',
  code: '#E5C07B',
}
const NODE_RADIUS = { post: 5, article: 7, project: 10, collection: 8, tag: 4, code: 6 }

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'project', label: 'Projetos' },
  { id: 'article', label: 'Artigos' },
  { id: 'code', label: 'Código' },
]

export default function GraphPage({ panel = false }) {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const simRef = useRef({ nodes: [], links: [], frame: 0, running: true })
  const mouseRef = useRef({ x: 0, y: 0, down: false, dragging: null, hover: null })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [tooltip, setTooltip] = useState(null)
  const [preview, setPreview] = useState(null)
  const filterRef = useRef('all')

  useEffect(() => { filterRef.current = filter }, [filter])

  useEffect(() => {
    api.get('/archive/graph').then(data => {
      const canvas = canvasRef.current
      if (!canvas) return
      const W = canvas.offsetWidth || 800
      const H = canvas.offsetHeight || 600
      const nodes = data.nodes.map(n => ({
        ...n,
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0,
        vy: 0,
      }))
      simRef.current = { nodes, links: data.links, frame: 0, running: true }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function getNodeId(node) {
      return node.id
    }

    function draw() {
      const { nodes, links, frame, running } = simRef.current
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#080810'
      ctx.fillRect(0, 0, W, H)

      // Grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      for (let x = 0; x < W; x += 30) {
        for (let y = 0; y < H; y += 30) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (nodes.length === 0) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const activeFilter = filterRef.current
      const hoverNode = mouseRef.current.hover
      const connectedIds = new Set()
      if (hoverNode) {
        connectedIds.add(hoverNode.id)
        for (const l of links) {
          if (l.source === hoverNode.id || l.target === hoverNode.id) {
            connectedIds.add(l.source)
            connectedIds.add(l.target)
          }
        }
      }

      const nodeById = new Map(nodes.map(n => [n.id, n]))

      // Draw links
      for (const link of links) {
        const src = nodeById.get(link.source)
        const tgt = nodeById.get(link.target)
        if (!src || !tgt) continue
        const isTag = link.kind === 'tag'
        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.lineTo(tgt.x, tgt.y)
        ctx.strokeStyle = isTag ? 'rgba(255,255,255,0.08)' : 'rgba(232,108,180,0.25)'
        ctx.lineWidth = isTag ? 0.5 : 1
        ctx.stroke()
      }

      // Draw nodes
      for (const node of nodes) {
        const group = node.group
        let alpha = 1
        if (activeFilter !== 'all') {
          if (group !== activeFilter) alpha = 0.15
        }
        if (hoverNode && !connectedIds.has(node.id)) alpha = Math.min(alpha, 0.2)

        const color = NODE_COLORS[group] || NODE_COLORS.post
        const r = NODE_RADIUS[group] || 5
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        if (hoverNode && node.id === hoverNode.id) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2)
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      // Simulation step
      if (running && frame < 300) {
        const k = 200
        for (const a of nodes) {
          for (const b of nodes) {
            if (a === b) continue
            const dx = a.x - b.x
            const dy = a.y - b.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = (k * k) / (dist * dist)
            a.vx += (dx / dist) * force * 0.1
            a.vy += (dy / dist) * force * 0.1
          }
        }
        for (const link of links) {
          const src = nodeById.get(link.source)
          const tgt = nodeById.get(link.target)
          if (!src || !tgt) continue
          const dx = tgt.x - src.x
          const dy = tgt.y - src.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const strength = 0.1
          src.vx += dx * strength
          src.vy += dy * strength
          tgt.vx -= dx * strength
          tgt.vy -= dy * strength
        }
        for (const node of nodes) {
          if (mouseRef.current.dragging === node) continue
          node.vx += (W / 2 - node.x) * 0.01
          node.vy += (H / 2 - node.y) * 0.01
          node.vx *= 0.85
          node.vy *= 0.85
          node.x += node.vx
          node.y += node.vy
          node.x = Math.max(10, Math.min(W - 10, node.x))
          node.y = Math.max(10, Math.min(H - 10, node.y))
        }
        simRef.current.frame = frame + 1
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [loading])

  function getNodeAt(x, y) {
    const { nodes } = simRef.current
    for (const node of nodes) {
      const r = NODE_RADIUS[node.group] || 5
      const dx = node.x - x
      const dy = node.y - y
      if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return node
    }
    return null
  }

  function handleMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseRef.current.x = x
    mouseRef.current.y = y
    if (mouseRef.current.dragging) {
      mouseRef.current.dragging.x = x
      mouseRef.current.dragging.y = y
      mouseRef.current.dragging.vx = 0
      mouseRef.current.dragging.vy = 0
    } else {
      const node = getNodeAt(x, y)
      mouseRef.current.hover = node
      setTooltip(node ? { label: node.label, x: e.clientX, y: e.clientY } : null)
    }
  }

  function handleMouseDown(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const node = getNodeAt(x, y)
    if (node) mouseRef.current.dragging = node
  }

  function handleMouseUp(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (!mouseRef.current.dragging) {
      const node = getNodeAt(x, y)
      if (node) setPreview(node)
    }
    mouseRef.current.dragging = null
  }

  function handleTouchStart(e) {
    const t = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const x = t.clientX - rect.left
    const y = t.clientY - rect.top
    const node = getNodeAt(x, y)
    if (node) {
      mouseRef.current.dragging = node
      mouseRef.current.hover = node
    }
  }

  function handleTouchMove(e) {
    e.preventDefault()
    const t = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const x = t.clientX - rect.left
    const y = t.clientY - rect.top
    if (mouseRef.current.dragging) {
      mouseRef.current.dragging.x = x
      mouseRef.current.dragging.y = y
      mouseRef.current.dragging.vx = 0
      mouseRef.current.dragging.vy = 0
    }
  }

  function handleTouchEnd(e) {
    if (!mouseRef.current.dragging) {
      const t = e.changedTouches[0]
      const rect = canvasRef.current.getBoundingClientRect()
      const node = getNodeAt(t.clientX - rect.left, t.clientY - rect.top)
      if (node) setPreview(node)
    }
    mouseRef.current.dragging = null
    mouseRef.current.hover = null
  }

  const isMobile = window.innerWidth < 768

  return (
    <div style={{ height: panel ? '100%' : '100dvh', display: 'flex', flexDirection: 'column', background: '#080810', position: 'relative' }}>
      {!panel && <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={18} /> <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Voltar</span>
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Grafo</span>
        }
      />}

      {/* Filter bar — top on desktop, bottom on mobile */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none',
        position: isMobile ? 'absolute' : 'relative',
        bottom: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        right: isMobile ? 0 : undefined,
        zIndex: 10,
        background: isMobile ? 'rgba(8,8,16,0.9)' : 'transparent',
        borderTop: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
      }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: 20,
            border: `1px solid ${filter === f.id ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}`,
            background: filter === f.id ? 'rgba(232,108,180,0.15)' : 'rgba(255,255,255,0.04)',
            color: filter === f.id ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>carregando grafo…</div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { mouseRef.current.hover = null; setTooltip(null) }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 8,
            background: 'rgba(8,8,16,0.95)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '6px 10px',
            fontFamily: 'var(--sans)', fontSize: 12, color: 'rgba(255,255,255,0.85)',
            pointerEvents: 'none', zIndex: 100, maxWidth: 200,
          }}>
            {tooltip.label}
          </div>
        )}

        {/* Preview panel */}
        {preview && (
          <div style={{
            position: 'absolute',
            right: isMobile ? 0 : 16,
            bottom: isMobile ? 0 : 16,
            left: isMobile ? 0 : undefined,
            width: isMobile ? '100%' : 280,
            background: 'rgba(8,8,16,0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: isMobile ? '16px 16px 0 0' : 12,
            padding: '20px',
            zIndex: 50,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{preview.group}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{preview.label}</div>
              </div>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>✕</button>
            </div>
            {preview.createdAt && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                {new Date(preview.createdAt).toLocaleDateString('pt-BR')}
              </div>
            )}
            {(preview.type === 'post' || preview.type === 'article') && (
              <button
                onClick={() => navigate(preview.type === 'article' ? `/articles/${preview.id}` : `/posts/${preview.id}`)}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(232,108,180,0.4)',
                  background: 'transparent', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11,
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                Abrir →
              </button>
            )}
            {preview.type === 'project' && (
              <button
                onClick={() => navigate(`/projects`)}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(232,108,180,0.4)',
                  background: 'transparent', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11,
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}
              >
                Ver projetos →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', left: 16, bottom: isMobile ? 60 : 16,
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'rgba(8,8,16,0.7)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, padding: '10px 12px',
      }}>
        {Object.entries(NODE_COLORS).map(([key, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: (NODE_RADIUS[key] || 5) * 2, height: (NODE_RADIUS[key] || 5) * 2, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
