import { Badge, Button, Modal, Stack } from 'react-bootstrap'

import { allowedNext } from '../lib/bedMachine.js'
import { STATUS_META } from '../lib/bedMeta.js'

/**
 * Shows ONLY the statuses reachable from the bed's current state (via the
 * state machine). Choosing one calls onChoose(status); the caller validates
 * and toasts.
 */
export default function BedStatusModal({ show, bed, onHide, onChoose }) {
  const next = bed ? allowedNext(bed.status) : []
  const current = bed ? STATUS_META[bed.status]?.label || bed.status : ''

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">Bed {bed?.label}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Current status: <Badge bg={STATUS_META[bed?.status]?.variant || 'secondary'}>{current}</Badge>
        </p>

        <p className="small text-uppercase text-muted mb-2">Allowed next status</p>
        <Stack gap={2}>
          {next.map((status) => (
            <Button
              key={status}
              variant={STATUS_META[status]?.variant || 'secondary'}
              onClick={() => onChoose(status)}
            >
              Set to {STATUS_META[status]?.label || status}
            </Button>
          ))}
        </Stack>

        {next.length === 0 && <p className="mb-0">No transitions available for this bed.</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
