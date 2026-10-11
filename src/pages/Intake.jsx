import { Container } from 'react-bootstrap'

import PageHeader from '../components/PageHeader.jsx'
import TriageForm from '../components/TriageForm.jsx'
import { useDocumentTitle } from '../lib/useDocumentTitle.js'

export default function Intake() {
  useDocumentTitle('Intake')

  return (
    <Container fluid="lg" className="py-4">
      <PageHeader
        title="Patient Intake"
        subtitle="Triage scoring and registration of waiting patients."
      />
      <TriageForm />
    </Container>
  )
}
