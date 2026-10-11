// Ward + bed seed data.
// Bed type is derived from the ward (ICU-1 -> 'icu', etc.).
// Statuses are hand-picked to look realistic: ~55% occupancy overall with
// ICU close to full, plus a few reserved/cleaning beds.

export const BED_STATUSES = ['available', 'occupied', 'cleaning', 'reserved']

export const wards = [
  { id: 'icu-1', name: 'ICU-1', type: 'icu', capacity: 10 },
  { id: 'general-a', name: 'General A', type: 'general', capacity: 30 },
  { id: 'general-b', name: 'General B', type: 'general', capacity: 24 },
  { id: 'isolation', name: 'Isolation', type: 'isolation', capacity: 8 },
]

// One status per bed, in bed-number order. Length must equal ward.capacity.
// ICU-1: 8 occupied, 1 reserved, 1 cleaning  (80% occupied - fairly full)
const STATUS_PATTERNS = {
  'icu-1': [
    'occupied', 'occupied', 'occupied', 'occupied', 'occupied',
    'occupied', 'occupied', 'occupied', 'reserved', 'cleaning',
  ],
  // General A: 15 occupied, 3 reserved, 3 cleaning, 9 available
  'general-a': [
    'occupied', 'occupied', 'available', 'occupied', 'cleaning',
    'occupied', 'occupied', 'available', 'occupied', 'reserved',
    'occupied', 'available', 'occupied', 'cleaning', 'occupied',
    'occupied', 'available', 'reserved', 'occupied', 'available',
    'occupied', 'available', 'occupied', 'cleaning', 'available',
    'occupied', 'reserved', 'available', 'occupied', 'available',
  ],
  // General B: 12 occupied, 2 reserved, 2 cleaning, 8 available
  'general-b': [
    'occupied', 'available', 'occupied', 'occupied', 'reserved',
    'cleaning', 'occupied', 'available', 'occupied', 'available',
    'occupied', 'occupied', 'available', 'occupied', 'reserved',
    'available', 'occupied', 'cleaning', 'occupied', 'available',
    'occupied', 'available', 'occupied', 'available',
  ],
  // Isolation: 4 occupied, 1 reserved, 1 cleaning, 2 available
  'isolation': [
    'occupied', 'occupied', 'available', 'reserved', 'occupied',
    'cleaning', 'available', 'occupied',
  ],
}

// Minutes-until-expiry assigned to reserved beds (cycled).
const RESERVED_MINUTES = [12, 22, 28, 8, 18, 25, 15]

const MINUTE = 60 * 1000

/**
 * Build the full bed list from the ward seed.
 * Reserved beds get a real expiry timestamp so the Step 4 sweep has work to do.
 * Occupied beds are marked with a placeholder patientId (they predate the queue;
 * later admissions set a real patient id).
 */
export function createBeds(now = Date.now()) {
  const beds = []
  let reservedIndex = 0

  for (const ward of wards) {
    const pattern = STATUS_PATTERNS[ward.id]
    for (let n = 1; n <= ward.capacity; n += 1) {
      const status = pattern[n - 1] || 'available'
      const bed = {
        id: `${ward.id}-${String(n).padStart(2, '0')}`,
        wardId: ward.id,
        type: ward.type,
        label: String(n).padStart(2, '0'),
        status,
        patientId: null,
        occupiedSince: null,
        expiresAt: null,
      }

      if (status === 'occupied') {
        // Staggered admission times so the data looks lived-in.
        bed.occupiedSince = now - (n * 37 + 60) * MINUTE
      } else if (status === 'reserved') {
        const minutes = RESERVED_MINUTES[reservedIndex % RESERVED_MINUTES.length]
        reservedIndex += 1
        bed.expiresAt = now + minutes * MINUTE
      }

      beds.push(bed)
    }
  }

  return beds
}
