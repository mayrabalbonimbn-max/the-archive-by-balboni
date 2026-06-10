import { useState, useRef } from 'react'
import { api } from '../utils/api'

// Detects @mention trigger at cursor position.
// Does not fire inside email addresses (@ preceded by a word char).
function detectTrigger(text, cursor) {
  const before = text.slice(0, cursor)
  const m = /@([\w]*)$/.exec(before)
  if (!m) return null
  const charBefore = before[m.index - 1]
  if (charBefore && /[\w@]/.test(charBefore)) return null
  return { query: m[1], start: m.index }
}

export function useMention(value, setValue, inputRef) {
  const [results, setResults] = useState([])
  const [trigger, setTrigger] = useState(null)
  const timerRef = useRef(null)

  function check(text, cursor) {
    const t = detectTrigger(text, cursor)
    clearTimeout(timerRef.current)

    if (!t) {
      setTrigger(null)
      setResults([])
      return
    }

    setTrigger(t)

    timerRef.current = setTimeout(() => {
      api.get(`/follows/search?q=${encodeURIComponent(t.query)}`)
        .then(list => setResults(list.slice(0, 6)))
        .catch(() => setResults([]))
    }, t.query.length === 0 ? 0 : 200)
  }

  function select(person) {
    if (!trigger) return
    const rawHandle = person.handle.replace(/^@/, '')
    const cursor = inputRef.current?.selectionStart ?? value.length
    const before = value.slice(0, trigger.start)
    const after = value.slice(cursor)
    const inserted = `@${rawHandle} `
    setValue(before + inserted + after)
    const newCursor = before.length + inserted.length
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursor, newCursor)
      }
    })
    close()
  }

  function close() {
    setTrigger(null)
    setResults([])
    clearTimeout(timerRef.current)
  }

  const isOpen = trigger !== null && results.length > 0

  return { isOpen, results, check, select, close }
}
