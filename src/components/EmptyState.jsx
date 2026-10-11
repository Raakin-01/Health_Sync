import { Card } from 'react-bootstrap'

function EmptyIcon({ variant }) {
  return (
    <svg
      className={`hs-empty__icon text-${variant} mb-3`}
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4" />
      <path d="M12 11v10" />
    </svg>
  )
}

// Friendly empty state: a soft icon, a short message and an optional action.
// `bare` renders just the centred content (no Card) for use inside a Card.
export default function EmptyState({ title, message, action, variant = 'primary', className = '', bare = false }) {
  const content = (
    <>
      <EmptyIcon variant={variant} />
      <h2 className="h6 mb-1">{title}</h2>
      {message && <p className="text-muted small mb-0">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </>
  )

  if (bare) {
    return <div className={`hs-empty text-center py-4 px-3 ${className}`}>{content}</div>
  }

  return (
    <Card className={`hs-card border-0 shadow-sm hs-empty ${className}`}>
      <Card.Body className="text-center py-5 px-4">{content}</Card.Body>
    </Card>
  )
}
