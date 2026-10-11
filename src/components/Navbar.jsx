import { Button, Container, Nav, Navbar as BsNavbar } from 'react-bootstrap'
import { NavLink, useNavigate } from 'react-router-dom'

import AlertBell from './AlertBell.jsx'
import { useStore, logout } from '../lib/store.js'
import { homeForSession, navLinksFor } from '../lib/roles.js'

export default function Navbar() {
  const { session } = useStore()
  const navigate = useNavigate()
  const links = navLinksFor(session?.role)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <BsNavbar bg="primary" variant="dark" expand="lg" sticky="top" className="hs-navbar shadow-sm">
      <Container fluid="lg">
        <BsNavbar.Brand
          as={NavLink}
          to={homeForSession(session)}
          className="d-flex align-items-center gap-2 fw-semibold"
        >
          <span className="hs-logo" aria-hidden="true">+</span>
          <span>HealthSync</span>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="main-nav" aria-label="Toggle navigation" />

        <BsNavbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-lg-center">
            {links.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} className="px-3">
                {link.label}
              </Nav.Link>
            ))}

            {session ? (
              <div className="d-flex align-items-lg-center gap-2 mt-2 mt-lg-0 ms-lg-3">
                <AlertBell />
                <span className="navbar-text text-white-50">
                  {session.name} ({session.role})
                </span>
                <Button variant="outline-light" size="sm" onClick={handleLogout} aria-label="Log out">
                  Logout
                </Button>
              </div>
            ) : (
              <Nav.Link as={NavLink} to="/login" className="px-3">
                Login
              </Nav.Link>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  )
}
