// Unit tests for the bed-status state machine (src/lib/bedMachine.js).
//
// The whole point is the transition table, so we assert the COMPLETE
// status x status matrix against an expected table (not just a few cases).

import { describe, it, expect } from 'vitest'

import { canTransition, allowedNext, RESERVATION_MINUTES, isExpired } from './bedMachine.js'

const STATUSES = ['available', 'occupied', 'cleaning', 'reserved']

// Expected transition table: EXPECTED[from][to] === true iff the move is legal.
const EXPECTED = {
  available: { available: false, occupied: true, cleaning: false, reserved: true },
  occupied: { available: false, occupied: false, cleaning: true, reserved: false },
  cleaning: { available: true, occupied: false, cleaning: false, reserved: false },
  reserved: { available: true, occupied: true, cleaning: false, reserved: false },
}

describe('canTransition - full status matrix', () => {
  const pairs = []
  for (const from of STATUSES) {
    for (const to of STATUSES) pairs.push([from, to, EXPECTED[from][to]])
  }

  it.each(pairs)('%s -> %s is %s', (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected)
  })

  it('rejects any transition from an unknown status', () => {
    for (const to of STATUSES) {
      expect(canTransition('disinfected', to)).toBe(false)
      expect(canTransition(undefined, to)).toBe(false)
    }
  })
})

describe('allowedNext', () => {
  it.each([
    ['available', ['reserved', 'occupied']],
    ['occupied', ['cleaning']],
    ['cleaning', ['available']],
    ['reserved', ['occupied', 'available']],
  ])('%s -> %j', (from, expected) => {
    expect(allowedNext(from)).toEqual(expected)
  })

  it('returns an empty list for an unknown status', () => {
    expect(allowedNext('nope')).toEqual([])
  })

  it('returns a copy, so callers cannot mutate the internal table', () => {
    const next = allowedNext('available')
    next.push('cleaning')
    expect(allowedNext('available')).toEqual(['reserved', 'occupied'])
  })
})

describe('RESERVATION_MINUTES', () => {
  it('is 30 minutes', () => {
    expect(RESERVATION_MINUTES).toBe(30)
  })
})

describe('isExpired', () => {
  const now = 1_000_000

  it('is false before the expiry instant', () => {
    expect(isExpired({ status: 'reserved', expiresAt: now + 1 }, now)).toBe(false)
  })

  it('is true exactly at the expiry instant (boundary is inclusive)', () => {
    expect(isExpired({ status: 'reserved', expiresAt: now }, now)).toBe(true)
  })

  it('is true after the expiry instant', () => {
    expect(isExpired({ status: 'reserved', expiresAt: now - 1 }, now)).toBe(true)
  })

  it('is false for a non-reserved bed even if it carries an expiry', () => {
    expect(isExpired({ status: 'occupied', expiresAt: now }, now)).toBe(false)
  })

  it('is false when there is no expiry or no bed', () => {
    expect(isExpired({ status: 'reserved' }, now)).toBe(false)
    expect(isExpired(null, now)).toBe(false)
  })
})
