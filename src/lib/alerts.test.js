// Unit tests for the alert rules (src/lib/alerts.js).
//
// alerts.js is deliberately pure: it exports the thresholds/constants and the
// predicate helpers. The stateful "have I already fired this?" bookkeeping
// (seen ids, the occupancy latch, reminded beds) lives in AlertWatcher.jsx and
// mirrors the small simulations below 1:1. These tests pin down the pure rules
// and the exact threshold constants the component relies on.

import { describe, it, expect } from 'vitest'

import {
  ALERT_TARGETS,
  CLEANING_REMINDER_MINUTES,
  ICU_HIGH_THRESHOLD,
  ICU_REARM_THRESHOLD,
  ICU_WARD_ID,
  SEVERITY_META,
  isTargetedAt,
  minutesSince,
  overdueCleaningBeds,
  targetRoles,
  waitingCriticalPatients,
  wardName,
  wardOccupancyPercent,
} from './alerts.js'

const NOW = 1_000_000_000_000
const MINUTE = 60 * 1000

// Build `total` ICU beds with the first `occupied` of them occupied.
function icuBeds(occupied, total = 100) {
  return Array.from({ length: total }, (_, i) => ({
    id: `icu-1-${i}`,
    wardId: ICU_WARD_ID,
    status: i < occupied ? 'occupied' : 'available',
  }))
}

describe('thresholds and constants', () => {
  it('use the documented values', () => {
    expect(CLEANING_REMINDER_MINUTES).toBe(45)
    expect(ICU_HIGH_THRESHOLD).toBe(90)
    expect(ICU_REARM_THRESHOLD).toBe(85)
    expect(ICU_WARD_ID).toBe('icu-1')
  })

  it('maps each severity to a toast variant', () => {
    expect(SEVERITY_META.critical.variant).toBe('danger')
    expect(SEVERITY_META.warning.variant).toBe('warning')
    expect(SEVERITY_META.info.variant).toBe('info')
  })
})

describe('role targeting', () => {
  it('declares the correct targets', () => {
    expect(ALERT_TARGETS).toEqual({
      critical: ['doctor', 'admin'],
      icu: ['admin', 'nurse'],
      cleaning: ['nurse', 'admin'],
    })
    expect(targetRoles('unknown')).toEqual([])
  })

  it.each([
    ['critical', 'doctor', true],
    ['critical', 'admin', true],
    ['critical', 'nurse', false],
    ['icu', 'admin', true],
    ['icu', 'nurse', true],
    ['icu', 'doctor', false],
    ['cleaning', 'nurse', true],
    ['cleaning', 'admin', true],
    ['cleaning', 'doctor', false],
  ])('isTargetedAt(%s, %s) -> %s', (kind, role, expected) => {
    expect(isTargetedAt(kind, role)).toBe(expected)
  })

  it('is false for a missing role or unknown kind', () => {
    expect(isTargetedAt('critical', null)).toBe(false)
    expect(isTargetedAt('critical', undefined)).toBe(false)
    expect(isTargetedAt('unknown', 'admin')).toBe(false)
  })
})

describe('waitingCriticalPatients', () => {
  it('keeps only waiting critical patients', () => {
    const patients = [
      { id: 'c1', status: 'waiting', level: 'critical' },
      { id: 'u1', status: 'waiting', level: 'urgent' },
      { id: 'a1', status: 'admitted', level: 'critical' },
    ]
    expect(waitingCriticalPatients(patients).map((p) => p.id)).toEqual(['c1'])
    expect(waitingCriticalPatients(null)).toEqual([])
  })
})

describe('critical rule - ignores patients present at start', () => {
  // Mirror of the AlertWatcher: on mount the seen-set is seeded from the
  // patients that already exist, so only patients added afterwards alert.
  function newCriticalSince(seen, patients) {
    const fresh = waitingCriticalPatients(patients).filter((p) => !seen.has(p.id))
    for (const p of fresh) seen.add(p.id)
    return fresh.map((p) => p.id)
  }

  it('fires only for critical patients added after seeding', () => {
    const c1 = { id: 'c1', status: 'waiting', level: 'critical' }
    const u1 = { id: 'u1', status: 'waiting', level: 'urgent' }
    const a1 = { id: 'a1', status: 'admitted', level: 'critical' }

    const seen = new Set()
    // Mount: seed from what is already there.
    for (const p of waitingCriticalPatients([c1, u1, a1])) seen.add(p.id)
    expect([...seen]).toEqual(['c1'])

    const c2 = { id: 'c2', status: 'waiting', level: 'critical' }
    expect(newCriticalSince(seen, [c1, u1, a1, c2])).toEqual(['c2'])
    // Re-checking the same list does not alert again.
    expect(newCriticalSince(seen, [c1, u1, a1, c2])).toEqual([])
  })
})

describe('wardOccupancyPercent', () => {
  it('rounds occupancy for the given ward and defaults to ICU-1', () => {
    expect(wardOccupancyPercent(icuBeds(8, 10), ICU_WARD_ID)).toBe(80)
    expect(wardOccupancyPercent(icuBeds(9, 10), ICU_WARD_ID)).toBe(90)
    expect(wardOccupancyPercent([{ wardId: ICU_WARD_ID, status: 'occupied' }])).toBe(100)
  })

  it('is 0 when the ward has no beds', () => {
    expect(wardOccupancyPercent([], ICU_WARD_ID)).toBe(0)
  })
})

describe('ICU rule - fires once at >= 90, re-arms only below 85', () => {
  // Mirror of the AlertWatcher's latch, driven by the production occupancy
  // function and the production thresholds.
  function fireSequence(occupiedCounts) {
    let above = false
    const fires = []
    for (const occupied of occupiedCounts) {
      const percent = wardOccupancyPercent(icuBeds(occupied, 100), ICU_WARD_ID)
      if (!above && percent >= ICU_HIGH_THRESHOLD) {
        above = true
        fires.push(percent)
      } else if (above && percent < ICU_REARM_THRESHOLD) {
        above = false
      }
    }
    return fires
  }

  it('fires on the first crossing, stays quiet while high, and re-fires after dropping', () => {
    //        80  90  92  84  90  95  89  85  90
    const fires = fireSequence([80, 90, 92, 84, 90, 95, 89, 85, 90])
    expect(fires).toEqual([90, 90])
  })

  it('does not re-arm at exactly 85 (only strictly below)', () => {
    // 90 (fire) -> 85 (still above, no re-arm) -> 85 (still no fire)
    expect(fireSequence([90, 85, 85])).toEqual([90])
    // 90 (fire) -> 84 (re-arm) -> 90 (fire again)
    expect(fireSequence([90, 84, 90])).toEqual([90, 90])
  })
})

describe('minutesSince', () => {
  it('returns whole minutes since the timestamp', () => {
    expect(minutesSince(NOW - 46 * MINUTE, NOW)).toBe(46)
  })

  it('returns 0 for a missing/invalid timestamp or a future one', () => {
    expect(minutesSince(undefined, NOW)).toBe(0)
    expect(minutesSince(NaN, NOW)).toBe(0)
    expect(minutesSince(NOW + MINUTE, NOW)).toBe(0)
  })
})

describe('cleaning rule - once per cleaning period after 45 minutes', () => {
  const bed = { id: 'c1', wardId: ICU_WARD_ID, label: '01', status: 'cleaning' }
  const at = (minutes) => ({ ...bed, updatedAt: NOW - minutes * MINUTE })

  it('does not fire before the 45-minute threshold', () => {
    expect(overdueCleaningBeds([at(40)], NOW)).toEqual([])
  })

  it('does not fire at exactly 45 minutes (threshold is strict)', () => {
    expect(overdueCleaningBeds([at(45)], NOW)).toEqual([])
  })

  it('fires once past 45 minutes, reporting the elapsed minutes', () => {
    const overdue = overdueCleaningBeds([at(46)], NOW)
    expect(overdue).toHaveLength(1)
    expect(overdue[0].bed.id).toBe('c1')
    expect(overdue[0].minutes).toBe(46)
  })

  it('ignores beds that are not cleaning', () => {
    expect(overdueCleaningBeds([{ ...at(60), status: 'available' }], NOW)).toEqual([])
  })

  // Mirror of the AlertWatcher's reminded-set: one reminder per cleaning period,
  // re-armed when the bed leaves cleaning.
  function fireOnce(reminded, beds) {
    const cleaningIds = new Set(
      beds.filter((b) => b.status === 'cleaning').map((b) => b.id),
    )
    for (const id of [...reminded]) if (!cleaningIds.has(id)) reminded.delete(id)

    const fired = []
    for (const { bed: b } of overdueCleaningBeds(beds, NOW)) {
      if (reminded.has(b.id)) continue
      reminded.add(b.id)
      fired.push(b.id)
    }
    return fired
  }

  it('reminds once, then re-arms when the bed leaves and re-enters cleaning', () => {
    const reminded = new Set()

    expect(fireOnce(reminded, [at(40)])).toEqual([])
    expect(fireOnce(reminded, [at(46)])).toEqual(['c1'])
    expect(fireOnce(reminded, [at(46)])).toEqual([])

    // Bed is cleaned and becomes available -> reminder re-arms.
    expect(fireOnce(reminded, [{ ...at(46), status: 'available' }])).toEqual([])
    expect(reminded.has('c1')).toBe(false)

    // It goes back into cleaning and is overdue again -> reminds once more.
    expect(fireOnce(reminded, [at(46)])).toEqual(['c1'])
  })
})

describe('wardName', () => {
  it('resolves a ward name, falling back to the id', () => {
    expect(wardName([{ id: ICU_WARD_ID, name: 'ICU-1' }], ICU_WARD_ID)).toBe('ICU-1')
    expect(wardName([], 'missing')).toBe('missing')
    expect(wardName(null, 'x')).toBe('x')
  })
})
