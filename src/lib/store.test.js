// Unit tests for the store's mutating actions (src/lib/store.js).
//
// The store is a module singleton, so every test starts from a clean seed:
// beforeEach clears storage, logs out and calls reset(). We also stop the
// reservation-expiry interval that the module starts on import, and close the
// BroadcastChannel, so tests are isolated and do not leave handles open.

import { describe, it, expect, beforeEach, afterAll } from 'vitest'

import {
  getState,
  subscribe,
  logout,
  reset,
  setBedStatus,
  admitPatient,
  reassessPatient,
  addPatient,
} from './store.js'
import * as sync from './sync.js'

// Stop the module-level expiry sweep (it is skipped under Vitest when
// import.meta.env.TEST is set, but clearing defensively is harmless).
if (typeof window !== 'undefined' && window.__hsExpirySweep) {
  clearInterval(window.__hsExpirySweep)
  window.__hsExpirySweep = undefined
}

const beds = () => getState().beds
const patients = () => getState().patients
const findBed = (id) => beds().find((b) => b.id === id)
const availableBed = () => beds().find((b) => b.status === 'available')
const occupiedBed = () => beds().find((b) => b.status === 'occupied')
const waitingPatient = () => patients().find((p) => p.status === 'waiting')

const CRITICAL_VITALS = {
  rr: 26,
  spo2: 90,
  sbp: 85,
  hr: 135,
  temp: 39.5,
  consciousness: 'Voice',
}
const NORMAL_VITALS = {
  rr: 16,
  spo2: 98,
  sbp: 125,
  hr: 78,
  temp: 36.8,
  consciousness: 'Alert',
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  logout()
  reset()
})

afterAll(() => {
  sync.close()
})

describe('setBedStatus', () => {
  it('accepts a valid available -> reserved transition and stamps an expiry', () => {
    const bed = availableBed()
    const result = setBedStatus(bed.id, 'reserved')

    expect(result).toEqual({ ok: true })
    const updated = findBed(bed.id)
    expect(updated.status).toBe('reserved')
    expect(updated.expiresAt).toBeGreaterThan(Date.now())
  })

  it('accepts a complete valid path: available -> reserved -> occupied -> cleaning -> available', () => {
    const bed = availableBed()
    expect(setBedStatus(bed.id, 'reserved').ok).toBe(true)
    expect(setBedStatus(bed.id, 'occupied').ok).toBe(true)
    expect(setBedStatus(bed.id, 'cleaning').ok).toBe(true)
    expect(setBedStatus(bed.id, 'available').ok).toBe(true)
    expect(findBed(bed.id).status).toBe('available')
  })

  it('rejects an invalid transition (available -> cleaning) and leaves the bed untouched', () => {
    const bed = availableBed()
    const result = setBedStatus(bed.id, 'cleaning')

    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/cannot move/i)
    expect(findBed(bed.id).status).toBe('available')
  })

  it('rejects a no-op transition to the current status', () => {
    const bed = occupiedBed()
    const result = setBedStatus(bed.id, 'occupied')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/already/i)
  })

  it('rejects an unknown bed', () => {
    const result = setBedStatus('does-not-exist', 'occupied')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not found/i)
  })
})

describe('admitPatient', () => {
  it('moves the patient to admitted and the bed to occupied in a single commit', () => {
    const patient = waitingPatient()
    const bed = availableBed()

    let commits = 0
    const unsubscribe = subscribe(() => {
      commits += 1
    })
    const result = admitPatient(patient.id, bed.id)
    unsubscribe()

    expect(result.ok).toBe(true)
    expect(commits).toBe(1)

    const admitted = patients().find((p) => p.id === patient.id)
    const occupied = findBed(bed.id)
    expect(admitted.status).toBe('admitted')
    expect(admitted.bedId).toBe(bed.id)
    expect(typeof admitted.waitMinutes).toBe('number')
    expect(occupied.status).toBe('occupied')
    expect(occupied.patientId).toBe(patient.id)
  })

  it('rejects a patient that is not waiting', () => {
    const patient = waitingPatient()
    const firstBed = availableBed()
    expect(admitPatient(patient.id, firstBed.id).ok).toBe(true)

    const secondBed = beds().find((b) => b.status === 'available')
    const result = admitPatient(patient.id, secondBed.id)

    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not waiting/i)
  })

  it('rejects a bed that is not available', () => {
    const patient = waitingPatient()
    const bed = occupiedBed()
    const result = admitPatient(patient.id, bed.id)

    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not available/i)
  })

  it('rejects an unknown patient or bed', () => {
    expect(admitPatient('no-such-patient', availableBed().id).ok).toBe(false)
    expect(admitPatient(waitingPatient().id, 'no-such-bed').ok).toBe(false)
  })
})

describe('reassessPatient', () => {
  it('rescales the score and appends a history entry', () => {
    const patient = patients().find((p) => p.id === 'pt-005')
    const historyBefore = patient.history.length

    const result = reassessPatient('pt-005', CRITICAL_VITALS)

    expect(result.ok).toBe(true)
    expect(result.previousScore).toBe(patient.score)

    const updated = patients().find((p) => p.id === 'pt-005')
    expect(updated.score).toBe(17)
    expect(updated.level).toBe('critical')
    expect(updated.history).toHaveLength(historyBefore + 1)
    expect(updated.history[updated.history.length - 1].score).toBe(17)
  })

  it('rejects invalid vitals with per-field errors', () => {
    const result = reassessPatient('pt-005', { ...CRITICAL_VITALS, rr: 999 })

    expect(result.ok).toBe(false)
    expect(result.errors.rr).toBeTruthy()
    // The patient is left unchanged.
    expect(patients().find((p) => p.id === 'pt-005').score).toBe(0)
  })

  it('rejects an unknown patient', () => {
    expect(reassessPatient('no-such-patient', CRITICAL_VITALS).ok).toBe(false)
  })
})

describe('addPatient', () => {
  it('scores a new patient and stamps arrival + history', () => {
    const before = Date.now()
    const patient = addPatient({
      name: 'Test Patient',
      age: 30,
      gender: 'Male',
      chiefComplaint: 'Checkup',
      vitals: NORMAL_VITALS,
    })

    expect(patient.id).toMatch(/^pt-\d{3}$/)
    expect(patient.status).toBe('waiting')
    expect(patient.score).toBe(0)
    expect(patient.level).toBe('non-urgent')
    expect(patient.arrivedAt).toBeGreaterThanOrEqual(before)
    expect(patient.history).toHaveLength(1)
    expect(patients().find((p) => p.id === patient.id)).toEqual(patient)
  })

  it('scores a critical patient correctly', () => {
    const patient = addPatient({ vitals: CRITICAL_VITALS })
    expect(patient.score).toBe(17)
    expect(patient.level).toBe('critical')
    expect(patient.redFlag).toBe(true)
  })
})
