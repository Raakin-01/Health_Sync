import { Button, Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import PageHeader from '../components/PageHeader.jsx'
import { useDocumentTitle } from '../lib/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('Not found')

  return (
    <Container className="py-5">
      <div className="text-center display-1 fw-bold text-primary mb-3">404</div>
      <PageHeader
        align="center"
        title="Page not found"
        subtitle="We could not find the page you were looking for."
        actions={
          <Button as={Link} to="/" variant="primary">
            Back to home
          </Button>
        }
      />
    </Container>
  )
}
