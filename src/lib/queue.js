// Priority-queue logic for the doctor queue (F5).
// Effective priority = triage score + 0.1 * minutes waited, so patients age up
// the list the longer they wait. Ties go to whoever arrived first.

import { MaxHeap } from './heap.js'

const MINUTE = 60 * 1000

export function minutesWaited(arrivedAt, now = Date.now()) {
  return Math.max(0, (now - arrivedAt) / MINUTE)
}

export function effectivePriority(patient, now = Date.now()) {
  return patient.score + 0.1 * minutesWaited(patient.arrivedAt, now)
}

// Comparator for the max-heap: higher effective priority first, then earlier
// arrival, then id (stable). Items carry `effectivePriority` computed with one `now`.
export function comparePriority(a, b) {
  if (b.effectivePriority !== a.effectivePriority) {
    return b.effectivePriority - a.effectivePriority
  }
  if (a.arrivedAt !== b.arrivedAt) return a.arrivedAt - b.arrivedAt
  return String(a.id).localeCompare(String(b.id))
}

export function withPriority(patient, now = Date.now()) {
  return { ...patient, effectivePriority: effectivePriority(patient, now) }
}

/**
 * Build a max-heap of the given patients using a SINGLE `now`, so every
 * comparison in the heap uses the same clock.
 */
export function buildQueue(patients, now = Date.now()) {
  const heap = new MaxHeap(comparePriority, (p) => p.id)
  for (const patient of patients) heap.insert(withPriority(patient, now))
  return heap
}

/** Ordered list (highest priority first) with `effectivePriority` attached. */
export function queueOrder(patients, now = Date.now()) {
  return buildQueue(patients, now).toSortedArray()
}

/** Compare the last two history entries to show a worsening/improving trend. */
export function trendOf(patient) {
  const history = patient.history || []
  if (history.length < 2) return { direction: null, delta: 0 }
  const last = history[history.length - 1].score
  const prev = history[history.length - 2].score
  const delta = last - prev
  return { direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat', delta }
}

export function formatWait(minutes) {
  const total = Math.max(0, Math.round(minutes))
  if (total < 60) return `${total}m`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return `${hours}h ${String(rest).padStart(2, '0')}m`
}
