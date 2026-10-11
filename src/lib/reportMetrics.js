import {
  avgCleaningTime,
  hourlyOccupancy,
  RANGE_LABELS,
  turnoverByWard,
  waitByLevel,
} from '../data/reportData.js'

// ---- LIVE measures (from the current store) ---------------------------------

export function currentOccupancy(beds) {
  if (!beds.length) return 0
  const occupied = beds.filter((b) => b.status === 'occupied').length
  return Math.round((occupied / beds.length) * 100)
}

export function occupancyByWard(beds, wards) {
  return wards.map((ward) => {
    const wb = beds.filter((b) => b.wardId === ward.id)
    const occupied = wb.filter((b) => b.status === 'occupied').length
    const total = wb.length
    return {
      wardId: ward.id,
      name: ward.name,
      occupancy: total ? Math.round((occupied / total) * 100) : 0,
      occupied,
      total,
    }
  })
}

export function waitingNow(patients) {
  return patients.filter((p) => p.status === 'waiting').length
}

// Mean waitMinutes of admitted patients, or null if none has been admitted yet.
export function liveAverageWait(patients) {
  const admitted = patients.filter((p) => p.waitMinutes != null)
  if (!admitted.length) return null
  return Math.round(admitted.reduce((s, p) => s + p.waitMinutes, 0) / admitted.length)
}

// ---- MOCK history accessors (marked as demo data by the caller) ------------

export function waitForLevel(range, level) {
  return waitByLevel[range]?.[level] ?? 0
}

export function mockAverageWait(range) {
  const vals = Object.values(waitByLevel[range] || {})
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
}

export function turnoverForWard(range, wardId) {
  return turnoverByWard[range]?.[wardId] ?? 0
}

export function mockTurnover(range) {
  const vals = Object.values(turnoverByWard[range] || {})
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
}

export function mockCleaning(range) {
  return avgCleaningTime[range] ?? avgCleaningTime.today
}

export function hourlyForWard(wardId) {
  return hourlyOccupancy[wardId] || []
}

// From light blue (low load) through blue/amber to red (100%).
export function heatmapColor(percent) {
  const p = Math.max(0, Math.min(100, percent))
  const hue = p < 50 ? 210 : p < 75 ? 180 : p < 90 ? 40 : 0
  const sat = 40 + (p / 100) * 45
  const light = 96 - (p / 100) * 48
  return `hsl(${hue}, ${Math.round(sat)}%, ${Math.round(light)}%)`
}

// ---- CSV ---------------------------------------------------------------------

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
}

export function reportCsv(range, summary, wardRows) {
  const rows = [
    ['HealthSync - Bed Analytics Report'],
    ['Range', RANGE_LABELS[range]],
    ['Generated', new Date().toISOString()],
    [],
    ['Metric', 'Value', 'Source'],
    ...summary.map((s) => [s.label, s.value, s.source || 'live']),
    [],
    ['Ward', 'Occupancy %', 'Avg wait today (min)', 'Avg wait 7d (min)', 'Turnover today', 'Turnover 7d'],
    ...wardRows.map((r) => [
      r.name,
      `${r.occupancy}%`,
      r.waitToday,
      r.waitWeek,
      r.turnoverToday,
      r.turnoverWeek,
    ]),
  ]
  return toCsv(rows)
}

// ---- Insights ---------------------------------------------------------------

// 2-3 auto-generated sentences from the heatmap + live occupancy.
export function buildInsights({ beds, wards, range }) {
  const insights = []
  let busiest = { value: -1, ward: '', hour: 0 }
  for (const ward of wards) {
    hourlyForWard(ward.id).forEach((value, hour) => {
      if (value > busiest.value) busiest = { value, ward: ward.name, hour }
    })
  }
  insights.push(
    `Peak load in the ${RANGE_LABELS[range].toLowerCase()} data: ${busiest.ward} at ` +
      `${String(busiest.hour).padStart(2, '0')}:00 reaching ${busiest.value}% occupancy.`,
  )

  const over80 = occupancyByWard(beds, wards).filter((w) => w.occupancy >= 80)
  if (over80.length) {
    insights.push(
      `${over80.map((w) => w.name).join(', ')} ${over80.length > 1 ? 'are' : 'is'} currently above 80% occupancy - consider freeing beds.`,
    )
  } else {
    insights.push('No ward is currently at or above 80% occupancy.')
  }

  let fastest = { value: -1, ward: '' }
  for (const ward of wards) {
    const value = turnoverForWard(range, ward.id)
    if (value > fastest.value) fastest = { value, ward: ward.name }
  }
  insights.push(
    `${fastest.ward} has the highest bed turnover (${fastest.value} stays/bed) - watch cleaning times there.`,
  )

  return insights
}