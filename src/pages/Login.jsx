import { useState } from 'react'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'

import { login, quickLogin, useStore } from '../lib/store.js'
import { roles } from '../data/users.js'
import { roleHome } from '../lib/roles.js'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const ROLE_LABEL = { nurse: 'Nurse', doctor: 'Doctor', admin: 'Admin' }

export default function Login() {
  const { session, users } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Already signed in (e.g. after a quick login, or revisiting /login): go home.
  if (session) return <Navigate to={roleHome(session.role)} replace />

  const emailInvalid = submitted && !EMAIL_RE.test(email.trim())
  const passwordInvalid = (submitted && !password) || Boolean(error)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    setError('')
    if (!EMAIL_RE.test(email.trim()) || !password) return
    if (!login(email, password)) setError('Incorrect email or password.')
  }

  function handleQuick(role) {
    setError('')
    quickLogin(role)
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={7} lg={5}>
          <Card className="hs-card shadow-sm border-0">
            <Card.Body className="p-4">
              <h1 className="h4 mb-1">Sign in to HealthSync</h1>
              <p className="text-muted small mb-4">Hospital Resource &amp; Bed Management</p>

              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    autoComplete="username"
                    placeholder="name@healthsync.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    isInvalid={emailInvalid}
                  />
                  <Form.Control.Feedback type="invalid">
                    Enter a valid email address.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="loginPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isInvalid={passwordInvalid}
                  />
                  <Form.Control.Feedback type="invalid">
                    {error || 'Enter your password.'}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100">
                  Sign in
                </Button>
              </Form>

              <hr className="my-4" />

              <p className="text-muted small text-uppercase mb-2">Quick login (demo)</p>
              <div className="d-grid gap-2 d-sm-flex">
                {roles.map((role) => (
                  <Button
                    key={role}
                    variant="outline-primary"
                    className="flex-fill"
                    onClick={() => handleQuick(role)}
                  >
                    Login as {ROLE_LABEL[role]}
                  </Button>
                ))}
              </div>

              <details className="mt-4 small text-muted">
                <summary>Demo accounts</summary>
                <ul className="mb-0 mt-2 ps-3">
                  {users.map((u) => (
                    <li key={u.id}>
                      {u.role}: <code>{u.email}</code> / <code>{u.password}</code>
                    </li>
                  ))}
                </ul>
              </details>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
