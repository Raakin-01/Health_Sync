import { Card, Container } from 'react-bootstrap'

export default function AdminAnalytics() {
  return (
    <Container fluid="lg" className="py-4">
      <h1 className="h4 mb-1">Admin Analytics</h1>
      <p className="text-muted">Occupancy, waiting times and ward load.</p>
      <Card className="hs-card border-0 shadow-sm">
        <Card.Body>
          <p className="mb-0 text-muted">Charts and the ward heatmap arrive in a later step.</p>
        </Card.Body>
      </Card>
    </Container>
  )
}
