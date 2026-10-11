import { Container, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <Container className="py-5 text-center">
      <div className="display-4 fw-bold text-primary mb-2">404</div>
      <h1 className="h4 mb-3">Page not found</h1>
      <p className="text-muted">
        We could not find the page you were looking for.
      </p>
      <Button as={Link} to="/" variant="primary">
        Back to home
      </Button>
    </Container>
  )
}
