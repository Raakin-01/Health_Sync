// Queue patients (waiting for triage/admission).
// Vitals are chosen to give a spread of triage levels once Step 5 lands:
//   pt-001 Critical, pt-002 Critical, pt-003 Urgent, pt-004 Urgent,
//   pt-005 Non-urgent, pt-006 Non-urgent.
// Scores are NOT stored here - lib/triage.js computes them. Arrival times are a
// few minutes apart so the Step 6 aging effect (wait time added to priority)
// produces visible re-ordering.

const MINUTE = 60 * 1000

/**
 * Build the waiting-room patient list. arrivedAt is relative to "now" so the
 * seed always looks fresh.
 */
export function createPatients(now = Date.now()) {
  return [
    {
      id: 'pt-001',
      name: 'Amara Bello',
      age: 68,
      gender: 'Female',
      chiefComplaint: 'Shortness of breath, chest tightness',
      vitals: { rr: 26, spo2: 92, sbp: 96, hr: 134, temp: 39.3, consciousness: 'Alert' },
      arrivedAt: now - 42 * MINUTE,
      status: 'waiting',
      admittedBedId: null,
    },
    {
      id: 'pt-002',
      name: 'Daniel Okoro',
      age: 54,
      gender: 'Male',
      chiefComplaint: 'Collapsed at home, unresponsive to pain',
      vitals: { rr: 30, spo2: 90, sbp: 85, hr: 120, temp: 39.8, consciousness: 'Pain' },
      arrivedAt: now - 35 * MINUTE,
      status: 'waiting',
      admittedBedId: null,
    },
    {
      id: 'pt-003',
      name: 'Fatima Sule',
      age: 31,
      gender: 'Female',
      chiefComplaint: 'High fever and fast breathing',
      vitals: { rr: 22, spo2: 95, sbp: 120, hr: 100, temp: 38.4, consciousness: 'Alert' },
      arrivedAt: now - 28 * MINUTE,
      status: 'waiting',
      admittedBedId: null,
    },
    {
      id: 'pt-004',
      name: 'Peter Nkemdirim',
      age: 47,
      gender: 'Male',
      chiefComplaint: 'Abdominal pain, feeling weak',
      vitals: { rr: 24, spo2: 94, sbp: 105, hr: 100, temp: 38.5, consciousness: 'Alert' },
      arrivedAt: now - 19 * MINUTE,
      status: 'waiting',
      admittedBedId: null,
    },
    {
      id: 'pt-005',
      name: 'Grace Adeyemi',
      age: 24,
      gender: 'Female',
      chiefComplaint: 'Ankle sprain after a fall',
      vitals: { rr: 18, spo2: 98, sbp: 122, hr: 78, temp: 37.1, consciousness: 'Alert' },
      arrivedAt: now - 11 * MINUTE,
      status: 'waiting',
      admittedBedId: null,
    },
    {
      id: 'pt-006',
      name: 'Samuel Ibrahim',
      age: 39,
      gender: 'Male',
      chiefComplaint: 'Mild headache and dizziness',
      vitals: { rr: 20, spo2: 96, sbp: 118, hr: 92, temp: 38.3, consciousness: 'Alert' },
      arrivedAt: now - 4 * MINUTE,
      status: 'waiting',
      admittedBedId: null,
    },
  ]
}
