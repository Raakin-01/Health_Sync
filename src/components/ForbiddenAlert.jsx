import { useEffect, useState } from 'react'
import { Alert, Container } from 'react-bootstrap'
import { useLocation } from 'react-router-dom'

import { useStore } from '../lib/store.js'

// Shown when ProtectedRoute bounced a user off a page their role can't view.
// The message is carried in router location state, so it does not need a toast system.
export default function ForbiddenAlert() {
  const location = useLocation()
  const { session } = useStore()
  const [hidden, setHidden] = useState(false)
  const forbidden = location.state?.forbidden

  useEffect(() => setHidden(false), [forbidden])

  if (!forbidden || hidden || !session) return null

  return (
    <Container fluid="lg" className="pt-3">
      <Alert variant="warning" dismissible onClose={() => setHidden(true)} className="mb-0">
        <strong>Access denied.</strong> The page <code>{forbidden}</code> is not available for your
        role ({session.role}). You were redirected to your home page.
      </Alert>
    </Container>
  )
}
