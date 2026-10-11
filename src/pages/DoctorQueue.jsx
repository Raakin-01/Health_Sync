import { Card, Container } from 'react-bootstrap'

export default function DoctorQueue() {
  return (
    <Container fluid="lg" className="py-4">
      <h1 className="h4 mb-1">Doctor Queue</h1>
      <p className="text-muted">Patients ranked by triage severity and waiting time.</p>
      <Card className="hs-card border-0 shadow-sm">
        <Card.Body>
          <p className="mb-0 text-muted">The priority queue arrives in a later step.</p>
        </Card.Body>
      </Card>
    </Container>
  )
}
