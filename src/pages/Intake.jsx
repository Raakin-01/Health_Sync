import { Container } from 'react-bootstrap'

import TriageForm from '../components/TriageForm.jsx'

export default function Intake() {
  return (
    <Container fluid="lg" className="py-4">
      <h1 className="h4 mb-1">Patient Intake</h1>
      <p className="text-muted mb-4">Triage scoring and registration of waiting patients.</p>
      <TriageForm />
    </Container>
  )
}
