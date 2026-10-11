// Alert rules for the real-time notifications (F10).
//
// Pure detection logic only - no React, no IO, no store imports. The
// AlertWatcher component owns the stateful "have I already raised this?"
// bookkeeping (seen ids, occupancy latch, reminded beds).

export const CLEANING_REMINDER_MINUTES = 45

// ICU occupancy (percent) that raises a warning, and the lower bound it must
// fall back under before the warning can fire again (hysteresis).
export const ICU_HIGH_THRESHOLD = 90
export const ICU_REARM_THRESHOLD = 85

export const ICU_WARD_ID = 'icu-1'

// Which roles each alert is delivered to.
export const ALERT_TARGETS = {
  critical: ['doctor', 'admin'],
  icu: ['admin', 'nurse'],
  cleaning: ['nurse', 'admin'],
}

// Severity -> presentation (Bootstrap toast variant + dropdown dot colour).
export const SEVERITY_META = {
  critical: { variant: 'danger', dot: '#dc3545', label: 'Critical' },
  warning: { variant: 'warning', dot: '#ffc107', label: 'Warning' },
  info: { variant: 'info', dot: '#0dcaf0', label: 'Info' },
}

export function targetRoles(kind) {
  return ALERT_TARGETS[kind] || []
}

export function isTargetedAt(kind, role) {
  return Boolean(role) && targetRoles(kind).includes(role)
}

/** Waiting patients whose triage level is critical. */
export function waitingCriticalPatients(patients) {
  return (patients || []).filter((p) => p.status === 'waiting' && p.level === 'critical')
}

/** Occupancy percent for one ward (defaults to ICU-1). */
export function wardOccupancyPercent(beds, wardId = ICU_WARD_ID) {
  const wardBeds = (beds || []).filter((b) => b.wardId === wardId)
  if (!wardBeds.length) return 0
  const occupied = wardBeds.filter((b) => b.status === 'occupied').length
  return Math.round((occupied / wardBeds.length) * 100)
}

/** Whole minutes since a timestamp (0 when the timestamp is missing/invalid). */
export function minutesSince(timestamp, now = Date.now()) {
  if (!Number.isFinite(timestamp)) return 0
  return Math.max(0, Math.round((now - timestamp) / 60000))
}

/** Beds stuck in cleaning for longer than the reminder threshold. */
export function overdueCleaningBeds(beds, now = Date.now(), threshold = CLEANING_REMINDER_MINUTES) {
  return (beds || [])
    .filter((b) => b.status === 'cleaning')
    .map((bed) => ({ bed, minutes: minutesSince(bed.updatedAt, now) }))
    .filter((entry) => entry.minutes > threshold)
}

export function wardName(wards, wardId) {
  const ward = (wards || []).find((w) => w.id === wardId)
  return ward ? ward.name : wardId
}
