// Role -> landing route and Navbar links. Kept out of components so the routing
// rules live in one place.

export const ROLE_HOME = {
  nurse: '/dashboard',
  doctor: '/queue',
  admin: '/analytics',
}

export function roleHome(role) {
  return ROLE_HOME[role] || '/login'
}

const NAV_LINKS = {
  nurse: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/intake', label: 'Intake' },
  ],
  doctor: [{ to: '/queue', label: 'Queue' }],
  admin: [
    { to: '/analytics', label: 'Analytics' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/intake', label: 'Intake' },
  ],
}

export function navLinksFor(role) {
  return NAV_LINKS[role] || []
}

/** Where to send a session right after login / when it hits "/". */
export function homeForSession(session) {
  return session ? roleHome(session.role) : '/login'
}
