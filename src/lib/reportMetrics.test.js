// Unit tests for the analytics/report metrics (src/lib/reportMetrics.js).

import { describe, it, expect } from 'vitest'

import {
  currentOccupancy,
  occupancyByWard,
  waitingNow,
  liveAverageWait,
  heatmapColor,
  toCsv,
} from './reportMetrics.js'

describe('currentOccupancy', () => {
  it('is the rounded percentage of beds currently occupied', () => {
    const beds = [
      { status: 'occupied' },
      { status: 'available' },
      { status: 'occupied' },
      { status: 'cleaning' },
    ]
    expect(currentOccupancy(beds)).toBe(50)
  })

  it('is 0 for an empty ward (no divide-by-zero)', () => {
    expect(currentOccupancy([])).toBe(0)
  })
})

describe('occupancyByWard', () => {
  it('reports occupancy / occupied / total per ward, including empty wards', () => {
    const beds = [
      { wardId: 'w1', status: 'occupied' },
      { wardId: 'w1', status: 'available' },
      { wardId: 'w2', status: 'occupied' },
      { wardId: 'w2', status: 'occupied' },
      { wardId: 'w2', status: 'occupied' },
    ]
    const wards = [
      { id: 'w1', name: 'One' },
      { id: 'w2', name: 'Two' },
      { id: 'w3', name: 'Three' },
    ]

    expect(occupancyByWard(beds, wards)).toEqual([
      { wardId: 'w1', name: 'One', occupancy: 50, occupied: 1, total: 2 },
      { wardId: 'w2', name: 'Two', occupancy: 100, occupied: 3, total: 3 },
      { wardId: 'w3', name: 'Three', occupancy: 0, occupied: 0, total: 0 },
    ])
  })
})

describe('waitingNow', () => {
  it('counts only patients with status waiting', () => {
    expect(
      waitingNow([{ status: 'waiting' }, { status: 'admitted' }, { status: 'waiting' }]),
    ).toBe(2)
    expect(waitingNow([])).toBe(0)
  })
})

describe('liveAverageWait', () => {
  it('is null when nobody has been admitted yet', () => {
    expect(liveAverageWait([{ status: 'waiting' }])).toBeNull()
    expect(liveAverageWait([])).toBeNull()
  })

  it('averages waitMinutes of admitted patients and rounds', () => {
    expect(liveAverageWait([{ waitMinutes: 10 }, { waitMinutes: 20 }])).toBe(15)
    expect(liveAverageWait([{ waitMinutes: 0 }, { waitMinutes: 5 }])).toBe(3)
  })

  it('ignores waiting patients that have no waitMinutes recorded', () => {
    expect(liveAverageWait([{ waitMinutes: null }, { waitMinutes: 10 }])).toBe(10)
  })
})

describe('heatmapColor', () => {
  it('clamps values below 0 and above 100', () => {
    expect(heatmapColor(-10)).toBe(heatmapColor(0))
    expect(heatmapColor(200)).toBe(heatmapColor(100))
  })

  it('returns the expected endpoints', () => {
    expect(heatmapColor(0)).toBe('hsl(210, 40%, 96%)')
    expect(heatmapColor(100)).toBe('hsl(0, 85%, 48%)')
  })

  it('stays a valid hsl colour with in-range saturation/lightness for 0..100', () => {
    for (let p = 0; p <= 100; p += 5) {
      const match = heatmapColor(p).match(/^hsl\((\d+), (\d+)%, (\d+)%\)$/)
      expect(match).not.toBeNull()
      const saturation = Number(match[2])
      const lightness = Number(match[3])
      expect(saturation).toBeGreaterThanOrEqual(40)
      expect(saturation).toBeLessThanOrEqual(85)
      expect(lightness).toBeGreaterThanOrEqual(48)
      expect(lightness).toBeLessThanOrEqual(96)
    }
  })
})

describe('toCsv', () => {
  it('joins simple cells with commas and rows with newlines', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd'],
      ]),
    ).toBe('a,b\nc,d')
  })

  it('quotes cells containing a comma', () => {
    expect(toCsv([['a,b']])).toBe('"a,b"')
  })

  it('doubles inner quotes and wraps the cell', () => {
    expect(toCsv([['a"b']])).toBe('"a""b"')
  })

  it('quotes cells containing a newline', () => {
    expect(toCsv([['a\nb']])).toBe('"a\nb"')
  })

  it('handles a cell mixing comma, quotes and a newline', () => {
    expect(toCsv([['a,"b"\nc']])).toBe('"a,""b""\nc"')
  })

  it('renders null/undefined as empty and numbers as strings', () => {
    expect(toCsv([[null, undefined, 5]])).toBe(',,5')
  })
})
