import { Card, Container } from 'react-bootstrap'

export default function NurseDashboard() {
  return (
    <Container fluid="lg" className="py-4">
      <h1 className="h4 mb-1">Nurse Dashboard</h1>
      <p className="text-muted">Live bed status and patient intake.</p>
      <Card className="hs-card border-0 shadow-sm">
        <Card.Body>
          <p className="mb-0 text-muted">The live bed board arrives in a later step.</p>
        </Card.Body>
      </Card>
    </Container>
  )
}
