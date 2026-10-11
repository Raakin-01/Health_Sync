import { Component } from 'react'
import { Button, Card, Container } from 'react-bootstrap'

const STATE_KEY = 'healthsync:state'
const SESSION_KEY = 'healthsync:session'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('HealthSync crashed:', error, info)
  }

  handleReset = () => {
    localStorage.removeItem(STATE_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <Container className="py-5" role="alert">
          <Card className="hs-card border-0 shadow-sm mx-auto" style={{ maxWidth: 540 }}>
            <Card.Body className="p-4">
              <h1 className="h5 mb-2">Something went wrong</h1>
              <p className="text-muted small mb-3">
                HealthSync hit an unexpected error while rendering. Try reloading the page, or
                reset the demo data to reseed everything from scratch.
              </p>
              <pre className="bg-light border rounded p-2 small text-danger overflow-auto mb-3">
                {String(this.state.error?.message || this.state.error)}
              </pre>
              <div className="d-flex gap-2 flex-wrap">
                <Button variant="primary" onClick={this.handleReset}>Reset demo data</Button>
                <Button variant="outline-secondary" onClick={() => window.location.reload()}>Reload page</Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      )
    }
    return this.props.children
  }
}