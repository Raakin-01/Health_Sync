import { Spinner } from 'react-bootstrap'

// Centered loading fallback for React.lazy route chunks. Also announced to
// assistive tech via role="status".
export default function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5" role="status">
      <Spinner animation="border" variant="primary" />
      <span className="visually-hidden">Loading page...</span>
    </div>
  )
}
