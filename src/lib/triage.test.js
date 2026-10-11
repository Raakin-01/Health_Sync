// Unit tests for the triage scoring + validation rules (src/lib/triage.js).
//
// These are the rules that decide how sick a patient is, so the whole point is
// to pin down every band edge exactly. scoreVitals returns a breakdown, so for
// the per-vital boundary tests we read the points for one vital while keeping
// the other five at a 0-point value - that isolates the band under test.

import { describe, it, expect } from 'vitest'

import { scoreVitals, validateVitals, CONSCIOUSNESS_LEVELS } from './triage.js'

// A set of vitals that scores 0 on every field (the neutral baseline).
const NORMAL = { rr: 16, spo2: 98, sbp: 125, hr: 78, temp: 36.8, consciousness: 'Alert' }

// Points awarded to a single vital value, with the rest at the 0-point baseline.
function pointsFor(key, value) {
  const scored = scoreVitals({ ...NORMAL, [key]: value })
  return scored.breakdown.find((item) => item.key === key).points
}

describe('scoreVitals - canonical examples', () => {
  it('scores the Critical example (RR 26, SpO2 90, SBP 85, HR 135, Temp 39.5, Voice) as 17 / critical', () => {
    const result = scoreVitals({
      rr: 26,
      spo2: 90,
      sbp: 85,
      hr: 135,
      temp: 39.5,
      consciousness: 'Voice',
    })
    expect(result.score).toBe(17)
    expect(result.level).toBe('critical')
  })

  it('scores the Urgent example (RR 22, SpO2 95, SBP 120, HR 100, Temp 38.4, Alert) as 5 / urgent', () => {
    const result = scoreVitals({
      rr: 22,
      spo2: 95,
      sbp: 120,
      hr: 100,
      temp: 38.4,
      consciousness: 'Alert',
    })
    expect(result.score).toBe(5)
    expect(result.level).toBe('urgent')
  })

  it('scores the Non-urgent example (RR 16, SpO2 98, SBP 125, HR 78, Temp 36.8, Alert) as 0 / non-urgent', () => {
    const result = scoreVitals({
      rr: 16,
      spo2: 98,
      sbp: 125,
      hr: 78,
      temp: 36.8,
      consciousness: 'Alert',
    })
    expect(result.score).toBe(0)
    expect(result.level).toBe('non-urgent')
  })
})

describe('scoreVitals - per-vital band edges', () => {
  it.each([
    [8, 3],
    [9, 1],
    [11, 1],
    [12, 0],
    [20, 0],
    [21, 2],
    [24, 2],
    [25, 3],
  ])('Respiratory rate %i scores %i', (value, expected) => {
    expect(pointsFor('rr', value)).toBe(expected)
  })

  it.each([
    [91, 3],
    [92, 2],
    [93, 2],
    [94, 1],
    [95, 1],
    [96, 0],
  ])('SpO2 %i scores %i', (value, expected) => {
    expect(pointsFor('spo2', value)).toBe(expected)
  })

  it.each([
    [90, 3],
    [91, 2],
    [100, 2],
    [101, 1],
    [110, 1],
    [111, 0],
    [219, 0],
    [220, 3],
  ])('Systolic BP %i scores %i', (value, expected) => {
    expect(pointsFor('sbp', value)).toBe(expected)
  })

  it.each([
    [40, 3],
    [41, 1],
    [50, 1],
    [51, 0],
    [90, 0],
    [91, 1],
    [110, 1],
    [111, 2],
    [130, 2],
    [131, 3],
  ])('Heart rate %i scores %i', (value, expected) => {
    expect(pointsFor('hr', value)).toBe(expected)
  })

  it.each([
    [35.0, 3],
    [35.1, 1],
    [36.0, 1],
    [36.1, 0],
    [38.0, 0],
    [38.1, 1],
    [39.0, 1],
    [39.1, 2],
  ])('Temperature %s scores %i', (value, expected) => {
    expect(pointsFor('temp', value)).toBe(expected)
  })

  it.each([
    ['Alert', 0],
    ['Voice', 3],
    ['Pain', 3],
    ['Unresponsive', 3],
  ])('Consciousness %s scores %i', (value, expected) => {
    expect(pointsFor('consciousness', value)).toBe(expected)
  })

  it('treats every documented consciousness level as known', () => {
    expect(CONSCIOUSNESS_LEVELS).toEqual(['Alert', 'Voice', 'Pain', 'Unresponsive'])
  })
})

describe('scoreVitals - level thresholds', () => {
  // Build totals without any single 3-point vital (so the red-flag rule does
  // not interfere with the pure score -> level mapping).
  const SUM_4 = { ...NORMAL, rr: 21, spo2: 95, hr: 100 } // 2 + 1 + 1 = 4
  const SUM_5 = { ...SUM_4, sbp: 101 } // + 1 = 5
  const SUM_6 = { ...SUM_5, temp: 38.5 } // + 1 = 6
  const SUM_7 = { ...NORMAL, rr: 21, spo2: 93, sbp: 100, hr: 110 } // 2 + 2 + 2 + 1 = 7

  it.each([
    ['total 4 -> non-urgent', SUM_4, 4, 'non-urgent'],
    ['total 5 -> urgent', SUM_5, 5, 'urgent'],
    ['total 6 -> urgent', SUM_6, 6, 'urgent'],
    ['total 7 -> critical', SUM_7, 7, 'critical'],
  ])('%s', (_name, vitals, expectedScore, expectedLevel) => {
    const result = scoreVitals(vitals)
    expect(result.score).toBe(expectedScore)
    expect(result.level).toBe(expectedLevel)
  })
})

describe('scoreVitals - red-flag rule', () => {
  it('raises a low total to urgent when one vital scores 3 (SpO2 90 -> total 3, urgent)', () => {
    const result = scoreVitals({ ...NORMAL, spo2: 90 })
    expect(result.score).toBe(3)
    expect(result.redFlag).toBe(true)
    expect(result.level).toBe('urgent')
  })

  it('does not set redFlag when no vital scores 3', () => {
    expect(scoreVitals(NORMAL).redFlag).toBe(false)
    const five = scoreVitals({ ...NORMAL, rr: 21, spo2: 95, hr: 100, sbp: 101 })
    expect(five.score).toBe(5)
    expect(five.redFlag).toBe(false)
    expect(five.level).toBe('urgent')
  })
})

describe('validateVitals', () => {
  const VALID = {
    rr: 26,
    spo2: 90,
    sbp: 85,
    hr: 135,
    temp: 39.5,
    consciousness: 'Voice',
  }

  it('accepts a fully valid set (returns an empty error map)', () => {
    expect(validateVitals(VALID)).toEqual({})
  })

  it('accepts a decimal temperature', () => {
    expect(validateVitals({ ...VALID, temp: 36.8 })).toEqual({})
  })

  it.each([
    ['hr', 19],
    ['hr', 251],
    ['rr', 3],
    ['rr', 61],
    ['spo2', 49],
    ['spo2', 101],
    ['sbp', 39],
    ['sbp', 301],
    ['temp', 29.9],
    ['temp', 45.1],
  ])('rejects out-of-range %s %s', (key, value) => {
    const errors = validateVitals({ ...VALID, [key]: value })
    expect(errors[key]).toBeTruthy()
    expect(Object.keys(errors)).toEqual([key])
  })

  it.each([
    ['', /required/],
    [null, /required/],
  ])('rejects an empty value %s', (value, pattern) => {
    expect(validateVitals({ ...VALID, rr: value }).rr).toMatch(pattern)
  })

  it('rejects a non-numeric value', () => {
    expect(validateVitals({ ...VALID, hr: 'abc' }).hr).toMatch(/must be a number/)
  })

  it('rejects an unknown consciousness level', () => {
    expect(validateVitals({ ...VALID, consciousness: 'Sleepy' }).consciousness).toMatch(/consciousness/i)
  })
})
