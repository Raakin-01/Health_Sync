// Mock HISTORICAL analytics data (Step 7). These are demo figures used when the
// live store has no real admissions/cleaning history to report.

// Average wait time (minutes) per triage level, for each range.
export const waitByLevel = {
  today: { 'non-urgent': 18, urgent: 34, critical: 9 },
  week: { 'non-urgent': 24, urgent: 41, critical: 12 },
}

// Bed turnover (stays per bed) per ward, for each range.
export const turnoverByWard = {
  today: { 'icu-1': 1.6, 'general-a': 2.9, 'general-b': 3.4, isolation: 1.1 },
  week: { 'icu-1': 12.4, 'general-a': 21.3, 'general-b': 25.8, isolation: 8.7 },
}

// Average cleaning time in minutes (mock), per range.
export const avgCleaningTime = { today: 22, week: 26 }

// Hourly occupancy percentage per ward, hours 0-23.
// General B has a clear evening peak (90-95% around 18-21h) and a quiet early
// morning; ICU stays fairly full all day.
export const hourlyOccupancy = {
  'icu-1': [72, 70, 68, 66, 66, 68, 72, 78, 82, 84, 85, 84, 83, 82, 80, 79, 80, 83, 86, 88, 87, 85, 80, 75],
  'general-a': [45, 42, 40, 38, 37, 40, 48, 58, 70, 78, 80, 78, 74, 70, 68, 66, 65, 68, 74, 76, 72, 65, 56, 49],
  'general-b': [28, 24, 21, 19, 18, 22, 30, 42, 58, 70, 76, 74, 70, 66, 62, 58, 60, 72, 91, 95, 94, 88, 60, 38],
  'isolation': [40, 38, 36, 34, 34, 38, 46, 55, 62, 64, 62, 58, 54, 52, 50, 48, 50, 56, 60, 62, 60, 55, 48, 43],
}

export const ANALYTIC_RANGES = ['today', 'week']
export const RANGE_LABELS = { today: 'Today', week: 'Last 7 days' }