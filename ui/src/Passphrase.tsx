import { useState } from 'react'
import { Button, Input } from 'antd'
import styles from './Passphrase.module.css'

export default function Passphrase({ active, onSubmit }: { active: boolean; onSubmit: (passphrase: string) => void }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  function submit() {
    if (!value.trim()) return
    onSubmit(value)
    setValue('')
    setOpen(false)
  }

  return (
    <>
      <button type="button" className={styles.trigger} disabled={active} onClick={() => setOpen(!open)}>
        Decrypt
      </button>
      {open && !active && (
        <div className={styles.panel}>
          <Input.Password
            autoFocus
            placeholder="passphrase"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPressEnter={submit}
            className={styles.field}
          />
          <Button type="primary" onClick={submit}>
            decrypt
          </Button>
        </div>
      )}
    </>
  )
}
