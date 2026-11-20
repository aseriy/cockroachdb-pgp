import { useEffect, useState } from 'react'
import { supabase } from './client.ts'
import styles from './Messages.module.css'

// The columns of pgp_messages the list reads; id is carried, not shown.
export type Row = { id: string; published_on: string; title: string }

const LABELS = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'] as const

function label(published: string) {
  const dt = new Date(published)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const week = new Date(today)
  week.setDate(week.getDate() - 7)
  if (dt >= today) return 'Today'
  if (dt >= yesterday) return 'Yesterday'
  if (dt >= week) return 'Previous 7 Days'
  return 'Older'
}

function group(rows: Row[]) {
  const groups: Record<string, Row[]> = {}
  for (const row of rows) {
    const key = label(row.published_on)
    ;(groups[key] ||= []).push(row)
  }
  return LABELS.filter((l) => groups[l]).map((l) => ({ label: l, items: groups[l] }))
}

export function fmtDate(published: string) {
  const dt = new Date(published)
  const days = Math.round((Date.now() - dt.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Messages({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let stale = false
    async function load() {
      const { data, error } = await supabase
        .from('pgp_messages')
        .select('id, published_on, title')
        .order('published_on', { ascending: false })
      if (error || stale) return
      const list = data as Row[]
      setRows(list)
      if (list.length && !selected) onSelect(list[0].id)
    }
    load()
    return () => {
      stale = true
    }
  }, [])

  return (
    <aside className={styles.pane} aria-label="Messages">
      {group(rows).map((g, i) => (
        <div className={i > 0 ? `${styles.group} ${styles.groupNext}` : styles.group} key={g.label}>
          <div className={styles.groupHead}>
            <span className={styles.groupLabel}>{g.label}</span>
          </div>
          {g.items.map((row) => (
            <div
              className={row.id === selected ? `${styles.row} ${styles.selected}` : styles.row}
              key={row.id}
              onClick={() => onSelect(row.id)}
              title={row.title}
            >
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>{row.title}</div>
                <div className={styles.rowDate}>{fmtDate(row.published_on)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </aside>
  )
}
