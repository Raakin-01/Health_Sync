// HealthSync store: a tiny useSyncExternalStore-based store.
//
// - State lives in one plain object and is persisted to localStorage.
// - On first load it hydrates from localStorage, or seeds from src/data.
// - Every local mutation is broadcast to other tabs via lib/sync.js; remote
//   updates are applied WITHOUT re-broadcasting to avoid echo loops.
// - Actions keep the state transitions pure (map/filter); only `commit` does IO.

import { useRef, useSyncExternalStore } from 'react'

import { wards, createBeds } from '../data/wards.js'
import { createPatients } from '../data/patients.js'
import { users } from '../data/users.js'
import { canTransition, RESERVATION_MINUTES } from './bedMachine.js'
import * as sync from './sync.js'

export const STORAGE_KEY = 'healthsync:state'
export const SESSION_KEY = 'healthsync:session'
export const SEED_VERSION = 1

// How long a reservation lasts. Mutable at runtime so demos can shorten it
// via window.__hs.setReservationMinutes(1) (dev only).
let reservationMinutes = RESERVATION_MINUTES

// Beds/patients are shared across tabs (localStorage + BroadcastChannel), but
// the login session is PER TAB (sessionStorage only, never persisted/broadcast),
// so a Nurse tab and a Doctor tab can be signed in at the same time.
function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // unavailable storage - stay logged out
  }
  return null
}

function writeSession(session) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // unavailable storage - session lives in memory for this page only
  }
}

const listeners = new Set()

// ---------------------------------------------------------------- seed + hydrate

function createSeed(now = Date.now()) {
  return {
    version: SEED_VERSION,
    seededAt: now,
    session: null, // { userId, name, role, email, loginAt }
    users: users.map((u) => ({ ...u })),
    wards: wards.map((w) => ({ ...w })),
    beds: createBeds(now),
    patients: createPatients(now),
  }
}

function hydrate() {
  let data = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === SEED_VERSION && parsed.data) {
        data = parsed.data
      }
    }
  } catch {
    // Corrupt/unavailable storage - fall through to a fresh seed.
  }
  const base = data || createSeed()
  // Session always comes from sessionStorage for this tab, never from shared data.
  return { ...base, session: readSession() }
}

let state = hydrate()

// ------------------------------------------------------------------- core store

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  for (const listener of [...listeners]) listener()
}

function persist() {
  try {
    // Session is intentionally excluded from shared persistence.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SEED_VERSION, data: { ...state, session: null } }),
    )
  } catch {
    // Storage full / private mode - the app still works for this session.
  }
}

/** Apply a new state (value or updater), persist, notify, and broadcast. */
function commit(updater, { broadcast = true } = {}) {
  const next = typeof updater === 'function' ? updater(state) : updater
  if (next === state || next == null) return
  state = next
  persist()
  notify()
  if (broadcast) sync.publish({ ...state, session: null })
}

// Remote updates are applied but never re-broadcast (breaks echo loops).
// The local session is preserved - it is per tab and must not travel.
sync.subscribe((remoteState) => {
  if (!remoteState || typeof remoteState !== 'object') return
  commit({ ...remoteState, session: state.session }, { broadcast: false })
})

// -------------------------------------------------------------------- helpers

function toSession(user) {
  return {
    userId: user.id,
    name: user.name,
    title: user.title,
    email: user.email,
    role: user.role,
    loginAt: Date.now(),
  }
}

// --------------------------------------------------------------------- actions

export function login(email, password) {
  const target = String(email || '').trim().toLowerCase()
  const user = state.users.find(
    (u) => u.email.toLowerCase() === target && u.password === String(password || ''),
  )
  if (!user) return false
  const session = toSession(user)
  writeSession(session)
  commit((s) => ({ ...s, session }))
  return true
}

export function quickLogin(role) {
  const user = state.users.find((u) => u.role === role)
  if (!user) return false
  const session = toSession(user)
  writeSession(session)
  commit((s) => ({ ...s, session }))
  return true
}

export function logout() {
  writeSession(null)
  commit((s) => ({ ...s, session: null }))
}

/**
 * Change a bed's status, enforcing the state machine in lib/bedMachine.js.
 * Reserving stamps an expiry; leaving 'reserved' clears it. Returns
 * { ok: true } or { ok: false, error } so callers can toast the reason.
 */
export function setBedStatus(bedId, status, patch = {}) {
  const bed = state.beds.find((b) => b.id === bedId)
  if (!bed) return { ok: false, error: `Bed ${bedId} was not found.` }
  if (bed.status === status) return { ok: false, error: `Bed is already ${status}.` }
  if (!canTransition(bed.status, status)) {
    return { ok: false, error: `Cannot move a bed from ${bed.status} to ${status}.` }
  }

  const now = Date.now()
  const next = {
    ...bed,
    ...patch,
    status,
    updatedAt: now,
    expiresAt: status === 'reserved' ? now + reservationMinutes * 60 * 1000 : null,
  }

  // Admission / discharge bookkeeping.
  if (status === 'occupied') {
    next.occupiedSince = bed.occupiedSince || now
  } else {
    next.patientId = null
    next.occupiedSince = null
  }

  commit((s) => ({ ...s, beds: s.beds.map((b) => (b.id === bedId ? next : b)) }))
  return { ok: true }
}

/** Admit a waiting patient into a bed, then drop them from the queue. */
export function admitPatient(patientId, bedId) {
  const now = Date.now()
  commit((s) => ({
    ...s,
    beds: s.beds.map((bed) =>
      bed.id === bedId
        ? { ...bed, status: 'occupied', patientId, occupiedSince: now, expiresAt: null, updatedAt: now }
        : bed,
    ),
    patients: s.patients.filter((p) => p.id !== patientId),
  }))
}

export function addPatient(patient) {
  commit((s) => ({ ...s, patients: [...s.patients, patient] }))
}

export function updatePatient(patientId, patch) {
  commit((s) => ({
    ...s,
    patients: s.patients.map((p) => (p.id === patientId ? { ...p, ...patch } : p)),
  }))
}

export function removePatient(patientId) {
  commit((s) => ({ ...s, patients: s.patients.filter((p) => p.id !== patientId) }))
}

/** Release any reservations whose expiry has passed back to 'available'. */
export function expireReservations(now = Date.now()) {
  commit((s) => {
    let changed = false
    const beds = s.beds.map((bed) => {
      if (bed.status === 'reserved' && bed.expiresAt && bed.expiresAt <= now) {
        changed = true
        return { ...bed, status: 'available', patientId: null, expiresAt: null, updatedAt: now }
      }
      return bed
    })
    return changed ? { ...s, beds } : s
  })
}

/** Change how long new reservations last (minutes). Dev/demo helper. */
export function setReservationMinutes(minutes) {
  const n = Number(minutes)
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Minutes must be a positive number.' }
  reservationMinutes = n
  return { ok: true, minutes: n }
}

export function getReservationMinutes() {
  return reservationMinutes
}

// Reservation expiry sweep: every 10s, move expired holds back to available.
// commit() broadcasts, so other tabs update live. The clear-then-set pattern
// keeps a single interval across Vite HMR reloads; skipped under Vitest.
const EXPIRY_SWEEP_MS = 10 * 1000
if (typeof window !== 'undefined' && !import.meta.env.TEST) {
  clearInterval(window.__hsExpirySweep)
  window.__hsExpirySweep = setInterval(() => expireReservations(Date.now()), EXPIRY_SWEEP_MS)
}

/** Wipe shared state and re-seed (handy for demos and tests). Keeps the tab's session. */
export function reset() {
  commit({ ...createSeed(), session: state.session })
}

// ----------------------------------------------------------------------- hooks

function shallowEqual(a, b) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => a[key] === b[key])
}

/** Subscribe to the whole state (stable reference between updates). */
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}

/**
 * Subscribe to a derived slice. The selector's result is cached and compared
 * shallowly so returning a fresh object/array does not cause render loops.
 */
export function useStoreSelector(selector) {
  const cache = useRef({ has: false, value: undefined })
  const getSelection = () => {
    const next = selector(getState())
    if (cache.current.has && shallowEqual(cache.current.value, next)) {
      return cache.current.value
    }
    cache.current = { has: true, value: next }
    return next
  }
  return useSyncExternalStore(subscribe, getSelection, getSelection)
}

// ------------------------------------------------------- dev-only debug handle

// DEV ONLY: inspect/mutate the store from the browser console. Remove before the
// final hand-off (see PROGRESS.md "Next phase").
if (import.meta.env.DEV) {
  window.__hs = {
    getState,
    subscribe,
    tabId: sync.tabId,
    actions: {
      login,
      quickLogin,
      logout,
      setBedStatus,
      admitPatient,
      addPatient,
      updatePatient,
      removePatient,
      expireReservations,
      reset,
      setReservationMinutes,
      getReservationMinutes,
    },
  }
}
