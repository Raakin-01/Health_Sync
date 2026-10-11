// Mock staff accounts. Passwords are fake and only used by the mock login page.
// The Login page also offers "quick login" buttons per role for demos.

export const roles = ['nurse', 'doctor', 'admin']

export const users = [
  {
    id: 'u-nurse',
    name: 'Grace Okafor',
    title: 'Charge Nurse',
    email: 'nurse@healthsync.test',
    password: 'nurse123',
    role: 'nurse',
  },
  {
    id: 'u-doctor',
    name: 'Dr. Alan Reyes',
    title: 'Emergency Physician',
    email: 'doctor@healthsync.test',
    password: 'doctor123',
    role: 'doctor',
  },
  {
    id: 'u-admin',
    name: 'Ada Mensah',
    title: 'Hospital Administrator',
    email: 'admin@healthsync.test',
    password: 'admin123',
    role: 'admin',
  },
]
