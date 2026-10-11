// Bed status state machine. Pure functions only - no React, no IO.
//
//   available -> reserved   (hold a bed)
//   available -> occupied   (walk-in)
//   reserved  -> occupied   (patient arrives)
//   reserved  -> available  (cancel / expiry)
//   occupied  -> cleaning    (discharge)
//   cleaning  -> available   (cleaned)
// Everything else is rejected.

export const RESERVATION_MINUTES = 30

const TRANSITIONS = {
  available: ['reserved', 'occupied'],
  reserved: ['occupied', 'available'],
  occupied: ['cleaning'],
  cleaning: ['available'],
}

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to))
}

export function allowedNext(from) {
  return TRANSITIONS[from] ? [...TRANSITIONS[from]] : []
}

/** A reserved bed is expired once its expiresAt has passed. */
export function isExpired(bed, now = Date.now()) {
  return Boolean(bed && bed.status === 'reserved' && bed.expiresAt && bed.expiresAt <= now)
}
