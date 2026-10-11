// Presentation metadata for bed statuses / ward types (labels + Bootstrap variants).
// Kept in lib so components stay dumb and the mapping lives in one place.

export const STATUS_META = {
  available: { label: 'Available', variant: 'success' },
  occupied: { label: 'Occupied', variant: 'danger' },
  cleaning: { label: 'Cleaning', variant: 'warning' },
  reserved: { label: 'Reserved', variant: 'primary' },
}

export const WARD_TYPE_META = {
  icu: { label: 'ICU', variant: 'danger' },
  general: { label: 'General', variant: 'primary' },
  isolation: { label: 'Isolation', variant: 'warning' },
}

export function statusLabel(status) {
  return STATUS_META[status]?.label || status
}

export function wardTypeLabel(type) {
  return WARD_TYPE_META[type]?.label || type
}
