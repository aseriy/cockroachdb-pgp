// The passphrase lives in local storage for a fixed window, then is erased.
export const PASSPHRASE_TTL_MS = 5 * 60 * 1000

const KEY = 'passphrase'

type Stored = { passphrase: string; expiresAt: number }

export function readPassphrase(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Stored
    if (stored.expiresAt > Date.now()) return stored
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
  return null
}

export function writePassphrase(passphrase: string): Stored {
  const stored = { passphrase, expiresAt: Date.now() + PASSPHRASE_TTL_MS }
  try {
    localStorage.setItem(KEY, JSON.stringify(stored))
  } catch {
    /* storage unavailable */
  }
  return stored
}

export function clearPassphrase() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}
