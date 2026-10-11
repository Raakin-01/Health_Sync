import { useEffect, useState } from 'react'

// Re-renders on an interval so time-based UI (reservation countdowns, wait times)
// stays fresh without polling the whole store.
export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
