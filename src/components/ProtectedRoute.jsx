import { Navigate, useLocation } from 'react-router-dom'

import { useStore } from '../lib/store.js'
import { roleHome } from '../lib/roles.js'

/**
 * Gate a route by login + role.
 * - not logged in        -> /login
 * - logged in, wrong role -> that role's home, with a forbidden notice shown there
 */
export default function ProtectedRoute({ allow, children }) {
  const { session } = useStore()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allow && !allow.includes(session.role)) {
    return <Navigate to={roleHome(session.role)} replace state={{ forbidden: location.pathname }} />
  }

  return children
}
