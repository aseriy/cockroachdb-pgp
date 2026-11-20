import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './client.ts'
import { fmtDate } from './Messages.tsx'
import styles from './Message.module.css'

// The columns of pgp_messages the pane reads; content is the armored message.
type Doc = { title: string; published_on: string; content: string }

export default function Message({
  id,
  passphrase,
  onDecrypted,
  onFailed,
}: {
  id: string
  passphrase: string | null
  onDecrypted: () => void
  onFailed: () => void
}) {
  const [doc, setDoc] = useState<Doc | null>(null)
  const [plain, setPlain] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stale = false
    setDoc(null)
    setPlain(null)
    setError('')
    async function load() {
      const { data, error } = await supabase
        .from('pgp_messages')
        .select('title, published_on, content')
        .eq('id', id)
        .single()
      if (stale) return
      if (error) setError(error.message)
      else setDoc(data as Doc)
    }
    load()
    return () => {
      stale = true
    }
  }, [id])

  useEffect(() => {
    if (!passphrase) {
      setPlain(null)
      return
    }
    let stale = false
    async function decrypt() {
      const { data, error } = await supabase.functions.invoke('cockroachdb-pgp-demo', { body: { id, passphrase } })
      if (stale) return
      if (error) {
        let message = error.message
        if (error instanceof FunctionsHttpError) {
          try {
            message = ((await error.context.json()) as { error?: string }).error ?? message
          } catch {
            /* body not JSON */
          }
        }
        setPlain(null)
        setError(message)
        onFailed()
        return
      }
      setError('')
      setPlain((data as { content: string }).content)
      onDecrypted()
    }
    decrypt()
    return () => {
      stale = true
    }
  }, [id, passphrase])

  if (!doc) return null

  return (
    <article className={styles.article}>
      <h1>{doc.title}</h1>
      <div className={styles.date}>{fmtDate(doc.published_on)}</div>
      {error && <div className={styles.err}>{error}</div>}
      {plain !== null ? (
        <div className={styles.abody}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
          >
            {plain}
          </ReactMarkdown>
        </div>
      ) : (
        <div className={styles.code}>
          <div className={styles.codeHead}>
            <span className={styles.codeLabel}>PGP message</span>
          </div>
          <pre className={styles.codeBody}>{doc.content}</pre>
        </div>
      )}
    </article>
  )
}
