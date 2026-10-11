// Cross-tab sync via BroadcastChannel (same browser, different tabs only).
//
// Each tab gets a random tabId. Messages carry the sender's tabId, and every
// tab ignores messages it sent itself, so a change is never applied twice in the
// originating tab. The store also avoids re-publishing when it applies a remote
// update - that is what prevents A -> B -> A echo loops.

const CHANNEL_NAME = 'healthsync'

export const tabId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`

export const isSupported = typeof BroadcastChannel !== 'undefined'

let channel = null
const listeners = new Set()

function ensureChannel() {
  if (channel || !isSupported) return
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event) => {
    const message = event.data
    if (!message || message.tabId === tabId) return // ignore our own messages
    for (const listener of [...listeners]) listener(message.payload, message)
  }
}

/** Register a listener for remote messages. Returns an unsubscribe function. */
export function subscribe(listener) {
  ensureChannel()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Broadcast a payload to the other tabs. */
export function publish(payload) {
  ensureChannel()
  if (!channel) return
  channel.postMessage({ tabId, payload, ts: Date.now() })
}

/** Close the channel (used by tests / teardown). */
export function close() {
  if (channel) {
    channel.close()
    channel = null
  }
  listeners.clear()
}
