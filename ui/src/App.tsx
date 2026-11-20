import { useEffect, useState } from 'react'
import Messages from './Messages.tsx'
import Message from './Message.tsx'
import Passphrase from './Passphrase.tsx'
import { clearPassphrase, readPassphrase, writePassphrase } from './passphrase.ts'
import styles from './App.module.css'

export default function App() {
  const [selected, setSelected] = useState('')
  // The stored passphrase, with its expiry, once it has decrypted a message.
  const [stored, setStored] = useState(readPassphrase)
  // A passphrase just entered and not yet proven against a message.
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    if (!stored) return
    const timer = setTimeout(() => {
      clearPassphrase()
      setStored(null)
    }, stored.expiresAt - Date.now())
    return () => clearTimeout(timer)
  }, [stored])

  function submit(passphrase: string) {
    setPending(passphrase)
  }

  function decrypted() {
    if (pending) {
      setStored(writePassphrase(pending))
      setPending(null)
    }
  }

  function failed() {
    setPending(null)
    clearPassphrase()
    setStored(null)
  }

  const passphrase = stored?.passphrase ?? pending

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <span className={styles.title}>PGP Demo</span>
        </div>
        <div className={styles.headerEnd}>
          <Passphrase active={Boolean(stored)} onSubmit={submit} />
        </div>
      </header>
      <div className={styles.body}>
        <Messages selected={selected} onSelect={setSelected} />
        <main className={styles.main}>
          <div className={styles.scroll}>
            <div className={styles.column}>
              {selected && (
                <Message id={selected} passphrase={passphrase} onDecrypted={decrypted} onFailed={failed} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
