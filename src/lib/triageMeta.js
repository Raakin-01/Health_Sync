// Display metadata for triage levels (label + Bootstrap variant + hex for charts).
export const LEVEL_META = {
  'non-urgent': { label: 'Non-urgent', variant: 'success', hex: '#198754' },
  urgent: { label: 'Urgent', variant: 'warning', hex: '#ffc107' },
  critical: { label: 'Critical', variant: 'danger', hex: '#dc3545' },
}

export const LEVEL_ORDER = ['non-urgent', 'urgent', 'critical']

export function levelMeta(level) {
  return LEVEL_META[level] || { label: level, variant: 'secondary', hex: '#6c757d' }
}
