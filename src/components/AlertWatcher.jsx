import { useEffect, useRef } from 'react'

import { useToast } from './Toasts.jsx'
import { addAlert } from '../lib/alertCenter.js'
import { useStore } from '../lib/store.js'
import { useNow } from '../lib/useNow.js'
import {
  ICU_HIGH_THRESHOLD,
  ICU_REARM_THRESHOLD,
  ICU_WARD_ID,
  SEVERITY_META,
  isTargetedAt,
  overdueCleaningBeds,
  waitingCriticalPatients,
  wardName,
  wardOccupancyPercent,
} from '../lib/alerts.js'

// Watches the shared store and raises role-targeted toasts for the three F10
// alert rules. Mounted once, inside ToastProvider. Every rule de-duplicates:
//   - critical: seen patient ids (seeded on mount so existing patients are quiet)
//   - ICU:      a latch that only re-arms below the low threshold
//   - cleaning: one reminder per bed per cleaning period
// Re-checks fire instantly on a store change (so a critical patient added in
// another tab - or by the DEV helper - alerts at once); the cleaning rule also
// runs on the shared useNow tick.
export default function AlertWatcher() {
  const { patients, beds, wards, session } = useStore()
  const toast = useToast()
  const now = useNow(15000)

  const role = session?.role || null
  const seenCritical = useRef(null)
  const icuAbove = useRef(null)
  const remindedBeds = useRef(new Set())

  function raise(kind, severity, message) {
    if (!isTargetedAt(kind, role)) return
    addAlert({ kind, severity, message })
    toast(message, SEVERITY_META[severity].variant)
  }

  // Critical patients: seed the seen set on mount so a reload never re-alerts
  // patients that already existed, then alert on each newly-seen critical id.
  useEffect(() => {
    const current = waitingCriticalPatients(patients)
    if (seenCritical.current === null) {
      seenCritical.current = new Set(current.map((p) => p.id))
      return
    }
    for (const patient of current) {
      if (seenCritical.current.has(patient.id)) continue
      seenCritical.current.add(patient.id)
      raise('critical', 'critical', `Critical patient: ${patient.name} (score ${patient.score})`)
    }
  }, [patients])

  // ICU occupancy: fire once on the way up, re-arm only after it drops below the
  // low threshold. Seeded from the current reading so a reload stays quiet.
  useEffect(() => {
    const percent = wardOccupancyPercent(beds, ICU_WARD_ID)
    if (icuAbove.current === null) {
      icuAbove.current = percent >= ICU_HIGH_THRESHOLD
      return
    }
    if (!icuAbove.current && percent >= ICU_HIGH_THRESHOLD) {
      icuAbove.current = true
      raise('icu', 'warning', `${wardName(wards, ICU_WARD_ID)} is at ${percent} percent occupancy`)
    } else if (icuAbove.current && percent < ICU_REARM_THRESHOLD) {
      icuAbove.current = false
    }
  }, [beds, wards])

  // Cleaning reminders: one per bed per cleaning period. A bed that leaves
  // cleaning is removed from the set so a later cleaning can remind again.
  // Re-checked instantly on a bed change (immediate for the DEV helper) and on
  // every useNow tick.
  useEffect(() => {
    const cleaningIds = new Set(beds.filter((b) => b.status === 'cleaning').map((b) => b.id))
    for (const id of remindedBeds.current) {
      if (!cleaningIds.has(id)) remindedBeds.current.delete(id)
    }
    for (const { bed, minutes } of overdueCleaningBeds(beds, now)) {
      if (remindedBeds.current.has(bed.id)) continue
      remindedBeds.current.add(bed.id)
      raise(
        'cleaning',
        'info',
        `${wardName(wards, bed.wardId)} bed ${bed.label} has been in cleaning for ${minutes} min`,
      )
    }
  }, [beds, now, wards])

  return null
}
