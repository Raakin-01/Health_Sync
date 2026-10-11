import { Card, Container } from 'react-bootstrap'

import NurseDashboard from './NurseDashboard.jsx'

export default function AdminAnalytics() {
  return (
    <>
      <Container fluid="lg" className="pt-4">
        <h1 className="h4 mb-1">Admin Analytics</h1>
        <p className="text-muted mb-3">Occupancy, waiting times and ward load.</p>
        <Card className="hs-card border-0 shadow-sm">
          <Card.Body>
            <p className="mb-0 text-muted">
              Waiting-time and turnover charts arrive in a later step. Below is the live
              read-only bed board.
            </p>
          </Card.Body>
        </Card>
      </Container>

      <NurseDashboard readOnly />
    </>
  )
}
