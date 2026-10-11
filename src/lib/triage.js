// Triage scoring (F3/F4). Pure functions only - no React, no IO.
// Point values come straight from the FSD plan.

export const CONSCIOUSNESS_LEVELS = ['Alert', 'Voice', 'Pain', 'Unresponsive']

// --- per-vital point rules -------------------------------------------------

function rrPoints(v) {
  if (v <= 8 || v >= 25) return 3
  if (v >= 21) return 2 // 21-24
  if (v >= 9 && v <= 11) return 1
  return 0 // 12-20
}

function spo2Points(v) {
  if (v <= 91) return 3
  if (v <= 93) return 2 // 92-93
  if (v <= 95) return 1 // 94-95
  return 0 // >=96
}

function sbpPoints(v) {
  if (v <= 90 || v >= 220) return 3
  if (v <= 100) return 2 // 91-100
  if (v <= 110) return 1 // 101-110
  return 0 // 111-219
}

function hrPoints(v) {
  if (v <= 40 || v >= 131) return 3
  if (v >= 111) return 2 // 111-130
  if ((v >= 41 && v <= 50) || (v >= 91 && v <= 110)) return 1
  return 0 // 51-90
}

function tempPoints(v) {
  if (v <= 35.0) return 3
  if (v >= 39.1) return 2
  if (v <= 36.0 || (v >= 38.1 && v <= 39.0)) return 1 // 35.1-36.0 or 38.1-39.0
  return 0 // 36.1-38.0
}

function consciousnessPoints(v) {
  return v === 'Alert' ? 0 : 3
}

const VITALS = [
  { key: 'rr', label: 'Resp. rate', format: (v) => `${v}/min`, points: rrPoints },
  { key: 'spo2', label: 'SpO2', format: (v) => `${v}%`, points: spo2Points },
  { key: 'sbp', label: 'Systolic BP', format: (v) => `${v} mmHg`, points: sbpPoints },
  { key: 'hr', label: 'Heart rate', format: (v) => `${v}/min`, points: hrPoints },
  { key: 'temp', label: 'Temperature', format: (v) => `${v} C`, points: tempPoints },
  { key: 'consciousness', label: 'Consciousness', format: (v) => v, points: consciousnessPoints },
]

/**
 * Score a set of vitals.
 * @returns {{ score:number, level:'non-urgent'|'urgent'|'critical', breakdown:Array, redFlag:boolean }}
 */
export function scoreVitals(vitals) {
  const breakdown = VITALS.map((vital) => ({
    key: vital.key,
    label: vital.label,
    value: vitals[vital.key],
    formatted: vital.format(vitals[vital.key]),
    points: vital.points(vitals[vital.key]),
  }))

  const score = breakdown.reduce((sum, item) => sum + item.points, 0)
  // Red-flag rule: any single vital scoring 3 forces at least Urgent.
  const redFlag = breakdown.some((item) => item.points === 3)

  let level = score >= 7 ? 'critical' : score >= 5 ? 'urgent' : 'non-urgent'
  if (redFlag && level === 'non-urgent') level = 'urgent'

  return { score, level, breakdown, redFlag }
}

// --- validation ------------------------------------------------------------

export const VITAL_RANGES = {
  rr: [4, 60],
  spo2: [50, 100],
  sbp: [40, 300],
  hr: [20, 250],
  temp: [30, 45],
}

const VITAL_LABELS = {
  rr: 'Respiratory rate',
  spo2: 'SpO2',
  sbp: 'Systolic BP',
  hr: 'Heart rate',
  temp: 'Temperature',
}

/** Per-field validation messages for the six vitals. Empty object = valid. */
export function validateVitals(values) {
  const errors = {}

  for (const [key, [min, max]] of Object.entries(VITAL_RANGES)) {
    const raw = values[key]
    if (raw === '' || raw == null) {
      errors[key] = `${VITAL_LABELS[key]} is required.`
      continue
    }
    const n = Number(raw)
    if (!Number.isFinite(n)) {
      errors[key] = `${VITAL_LABELS[key]} must be a number.`
    } else if (n < min || n > max) {
      errors[key] = `${VITAL_LABELS[key]} must be between ${min} and ${max}.`
    }
  }

  if (!CONSCIOUSNESS_LEVELS.includes(values.consciousness)) {
    errors.consciousness = 'Select a consciousness level.'
  }

  return errors
}

/** AGE validation (separate from vitals). Returns '' when valid. */
export function validateAge(age) {
  if (age === '' || age == null) return 'Age is required.'
  const n = Number(age)
  if (!Number.isFinite(n)) return 'Age must be a number.'
  if (n < 0 || n > 120) return 'Age must be between 0 and 120.'
  return ''
}
