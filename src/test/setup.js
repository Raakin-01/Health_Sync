// Vitest global setup: keep every test isolated from shared browser storage and
// from real cross-tab messaging.
//
// The store (src/lib/store.js) reads/writes localStorage + sessionStorage and
// sync.js opens a BroadcastChannel. Under Vitest we clear storage after each
// test and replace BroadcastChannel with a no-op so no real channel is opened
// (which also avoids leaking handles that could keep the runner alive).

import { afterEach } from 'vitest'

afterEach(() => {
  try {
    localStorage.clear()
  } catch {
    // storage unavailable - nothing to clear
  }
  try {
    sessionStorage.clear()
  } catch {
    // storage unavailable - nothing to clear
  }
})

class NoopBroadcastChannel {
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

if (typeof globalThis.BroadcastChannel !== 'undefined') {
  globalThis.BroadcastChannel = NoopBroadcastChannel
}
