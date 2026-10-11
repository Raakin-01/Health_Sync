import { Card } from 'react-bootstrap'

export default function StatCard({ label, value, hint, variant = 'primary' }) {
  return (
    <Card className="hs-card border-0 shadow-sm h-100">
      <Card.Body className="py-3">
        <div className={`text-${variant} text-uppercase small fw-semibold`}>{label}</div>
        <div className="fs-3 fw-bold lh-1 my-1">{value}</div>
        {hint && <div className="text-muted small">{hint}</div>}
      </Card.Body>
    </Card>
  )
}
