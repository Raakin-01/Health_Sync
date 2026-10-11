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
import { scoreVitals, validateVitals } from './triage.js'
import { CLEANING_REMINDER_MINUTES } from './alerts.js'
import * as sync from './sync.js'

export const STORAGE_KEY = 'healthsync:state'
export const SESSION_KEY = 'healthsync:session'
export const SEED_VERSION = 2

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

/** Attach triage score/level (and arrivedAt + history) computed from the vitals. */
function scorePatient(patient) {
  if (!patient || !patient.vitals) return patient
  const scored = scoreVitals(patient.vitals)
  const arrivedAt = patient.arrivedAt ?? Date.now()
  // Seed history with the first score so trend arrows have a baseline.
  const history =
    patient.history && patient.history.length
      ? patient.history
      : [{ score: scored.score, level: scored.level, at: arrivedAt }]
  return {
    ...patient,
    arrivedAt,
    score: scored.score,
    level: scored.level,
    breakdown: scored.breakdown,
    redFlag: scored.redFlag,
    history,
  }
}

function createSeed(now = Date.now()) {
  return {
    version: SEED_VERSION,
    seededAt: now,
    session: null, // { userId, name, role, email, loginAt }
    users: users.map((u) => ({ ...u })),
    wards: wards.map((w) => ({ ...w })),
    beds: createBeds(now),
    patients: createPatients(now).map(scorePatient),
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
  // Re-score patients so a state persisted before triage existed is still valid.
  return { ...base, session: readSession(), patients: (base.patients || []).map(scorePatient) }
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

/**
 * Admit a waiting patient into a bed. Validates the patient is waiting and the
 * bed is available/reserved (respecting the state machine), then records the
 * admission on both the bed and the patient in ONE commit.
 * Returns { ok: true, patient, bedId } or { ok: false, error }.
 */
export function admitPatient(patientId, bedId) {
  const patient = state.patients.find((p) => p.id === patientId)
  if (!patient) return { ok: false, error: 'Patient was not found.' }
  if (patient.status !== 'waiting') return { ok: false, error: 'Patient is not waiting.' }

  const bed = state.beds.find((b) => b.id === bedId)
  if (!bed) return { ok: false, error: 'Bed was not found.' }
  if (bed.status !== 'available' && bed.status !== 'reserved') {
    return { ok: false, error: `Bed ${bed.label} is not available (${bed.status}).` }
  }
  if (!canTransition(bed.status, 'occupied')) {
    return { ok: false, error: `Cannot occupy a bed that is ${bed.status}.` }
  }

  const now = Date.now()
  const waitMinutes = Math.max(0, Math.round((now - patient.arrivedAt) / 60000))
  const admitted = { ...patient, status: 'admitted', admittedAt: now, bedId, waitMinutes }

  commit((s) => ({
    ...s,
    beds: s.beds.map((b) =>
      b.id === bedId
        ? { ...b, status: 'occupied', patientId, occupiedSince: now, expiresAt: null, updatedAt: now }
        : b,
    ),
    patients: s.patients.map((p) => (p.id === patientId ? admitted : p)),
  }))

  return { ok: true, patient: admitted, bedId }
}

/**
 * Re-score a patient with new vitals, appending to their history (trend).
 * Returns { ok: true, patient, previousScore } or { ok: false, error, errors }.
 */
export function reassessPatient(patientId, newVitals) {
  const errors = validateVitals(newVitals)
  if (Object.keys(errors).length > 0) return { ok: false, error: 'Invalid vitals.', errors }

  const patient = state.patients.find((p) => p.id === patientId)
  if (!patient) return { ok: false, error: 'Patient was not found.' }

  const scored = scoreVitals({ ...newVitals })
  const entry = { score: scored.score, level: scored.level, at: Date.now() }
  const updated = {
    ...patient,
    vitals: { ...newVitals },
    score: scored.score,
    level: scored.level,
    breakdown: scored.breakdown,
    redFlag: scored.redFlag,
    history: [...(patient.history || []), entry],
  }

  commit((s) => ({ ...s, patients: s.patients.map((p) => (p.id === patientId ? updated : p)) }))
  return { ok: true, patient: updated, previousScore: patient.score }
}

/** DEV/DEMO ONLY: move a patient's arrival earlier to show the aging effect. */
export function shiftArrival(patientId, minutes) {
  const patient = state.patients.find((p) => p.id === patientId)
  if (!patient) return { ok: false, error: 'Patient was not found.' }
  const delta = Number(minutes) * 60000
  if (!Number.isFinite(delta)) return { ok: false, error: 'Minutes must be a number.' }
  commit((s) => ({
    ...s,
    patients: s.patients.map((p) => (p.id === patientId ? { ...p, arrivedAt: p.arrivedAt - delta } : p)),
  }))
  return { ok: true }
}

function nextPatientId(patients) {
  const numbers = patients
    .map((p) => Number((p.id.match(/^pt-(\d+)$/) || [])[1]))
    .filter(Number.isFinite)
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `pt-${String(next).padStart(3, '0')}`
}

/**
 * Score and add a waiting patient. `input` is { name?, age?, gender?,
 * chiefComplaint?, vitals }. Stamps arrivedAt and returns the stored patient
 * (so callers can toast the name/score/level).
 */
export function addPatient(input = {}) {
  const vitals = { ...(input.vitals || {}) }
  const scored = scoreVitals(vitals)
  const id = nextPatientId(state.patients)
  const suffix = Number(id.replace('pt-', ''))
  const name = String(input.name || '').trim() || `Unknown Patient #${suffix}`

  const patient = {
    id,
    name,
    age: input.age === '' || input.age == null ? null : Number(input.age),
    gender: input.gender || null,
    chiefComplaint: String(input.chiefComplaint || '').trim(),
    vitals,
    arrivedAt: Date.now(),
    status: 'waiting',
    admittedBedId: null,
    score: scored.score,
    level: scored.level,
    breakdown: scored.breakdown,
    redFlag: scored.redFlag,
    history: [{ score: scored.score, level: scored.level, at: Date.now() }],
  }

  commit((s) => ({ ...s, patients: [...s.patients, patient] }))
  return patient
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
  // DEV ONLY: move a bed's updatedAt earlier so the cleaning reminder can be
  // exercised without waiting CLEANING_REMINDER_MINUTES.
  function shiftBedUpdated(bedId, minutes) {
    const bed = state.beds.find((b) => b.id === bedId)
    if (!bed) return { ok: false, error: 'Bed was not found.' }
    const delta = Number(minutes) * 60000
    if (!Number.isFinite(delta)) return { ok: false, error: 'Minutes must be a number.' }
    commit((s) => ({
      ...s,
      beds: s.beds.map((b) => (b.id === bedId ? { ...b, updatedAt: b.updatedAt - delta } : b)),
    }))
    return { ok: true }
  }

  // DEV ONLY: trigger each F10 alert path from the console.
  //   __hs.actions.demoAlert('critical' | 'icu' | 'cleaning')
  function demoAlert(kind) {
    if (kind === 'critical') {
      addPatient({
        name: 'Demo Critical Patient',
        age: 70,
        gender: 'Male',
        chiefComplaint: 'Collapse with severe derangement',
        vitals: { rr: 26, spo2: 90, sbp: 85, hr: 135, temp: 39.5, consciousness: 'Voice' },
      })
      return { ok: true }
    }
    if (kind === 'icu') {
      const bed = state.beds.find(
        (b) => b.wardId === 'icu-1' && (b.status === 'reserved' || b.status === 'available'),
      )
      if (!bed) return { ok: false, error: 'No free ICU bed to occupy.' }
      return setBedStatus(bed.id, 'occupied')
    }
    if (kind === 'cleaning') {
      const bed = state.beds.find((b) => b.status === 'cleaning')
      if (!bed) return { ok: false, error: 'No bed is currently cleaning.' }
      return shiftBedUpdated(bed.id, CLEANING_REMINDER_MINUTES + 20)
    }
    return { ok: false, error: "Unknown alert kind (use 'critical', 'icu' or 'cleaning')." }
  }

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
      reassessPatient,
      shiftArrival,
      shiftBedUpdated,
      demoAlert,
    },
  }
}
