// Unit tests for the doctor-queue priority logic (src/lib/queue.js).
//
// Effective priority = triage score + 0.1 * minutes waited, so patients age up
// the list. Ties break by earlier arrival, then by id. Every test passes an
// explicit `now` so nothing depends on the real clock.

import { describe, it, expect } from 'vitest'

import { effectivePriority, minutesWaited, queueOrder } from './queue.js'

const NOW = 1_000_000_000_000

describe('minutesWaited', () => {
  it('computes whole minutes since arrival', () => {
    expect(minutesWaited(NOW - 30 * 60000, NOW)).toBe(30)
  })

  it('never goes negative for a future arrival', () => {
    expect(minutesWaited(NOW + 5 * 60000, NOW)).toBe(0)
  })
})

describe('effectivePriority', () => {
  it('adds 0.1 per waited minute to the score', () => {
    const patient = { score: 4, arrivedAt: NOW - 30 * 60000 }
    expect(effectivePriority(patient, NOW)).toBeCloseTo(7, 10)
  })
})

describe('queueOrder', () => {
  it('lets a low score age past a higher waiting score, but not past a critical one', () => {
    const aged = { id: 'aged', score: 0, arrivedAt: NOW - 80 * 60000 }
    const mid = { id: 'mid', score: 5, arrivedAt: NOW }
    const top = { id: 'top', score: 17, arrivedAt: NOW }

    const order = queueOrder([mid, aged, top], NOW).map((p) => p.id)
    expect(order).toEqual(['top', 'aged', 'mid'])
    expect(effectivePriority(aged, NOW)).toBeCloseTo(8, 6)
  })

  it('breaks ties by earlier arrival, then by id', () => {
    const a = { id: 'a', score: 5, arrivedAt: NOW - 10000 }
    const b = { id: 'b', score: 5, arrivedAt: NOW - 5000 }
    const c = { id: 'c', score: 5, arrivedAt: NOW - 10000 }

    const order = queueOrder([b, a, c], NOW).map((p) => p.id)
    expect(order).toEqual(['a', 'c', 'b'])
  })

  it('attaches effectivePriority using the single supplied now', () => {
    const patients = [
      { id: 'p1', score: 2, arrivedAt: NOW - 10 * 60000 },
      { id: 'p2', score: 2, arrivedAt: NOW },
    ]
    const ordered = queueOrder(patients, NOW)
    expect(ordered[0].id).toBe('p1')
    expect(ordered[0].effectivePriority).toBeCloseTo(3, 10)
    expect(ordered[1].effectivePriority).toBeCloseTo(2, 10)
  })

  it('is deterministic for a fixed now', () => {
    const patients = [
      { id: 'p1', score: 7, arrivedAt: NOW - 3 * 60000 },
      { id: 'p2', score: 7, arrivedAt: NOW - 3 * 60000 },
      { id: 'p3', score: 11, arrivedAt: NOW - 1 * 60000 },
    ]
    const first = queueOrder(patients, NOW).map((p) => p.id)
    const second = queueOrder(patients, NOW).map((p) => p.id)
    expect(first).toEqual(second)
  })
})
