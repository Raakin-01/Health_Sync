import { Button, Card, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import EmptyState from './EmptyState.jsx'
import QueueRow from './QueueRow.jsx'

/**
 * Priority-ordered waiting list. Horizontally scrolls on narrow screens.
 * `canIntake` lets nurses/admins jump to Intake from the empty state.
 */
export default function QueueList({ patients, now, readOnly, canIntake, onAdmit, onRecheck }) {
  if (patients.length === 0) {
    return (
      <EmptyState
        title="No patients waiting"
        message="New patients appear here as soon as they are registered."
        action={
          canIntake ? (
            <Button as={Link} to="/intake" variant="primary">
              Go to Intake
            </Button>
          ) : null
        }
      />
    )
  }

  return (
    <Card className="hs-card border-0 shadow-sm">
      <div className="table-responsive">
        <Table hover align="middle" className="mb-0">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Patient</th>
              <th>Complaint</th>
              <th>Level</th>
              <th className="text-center">Score</th>
              <th className="text-center">Priority</th>
              <th>Waiting</th>
              <th>Vitals</th>
              <th>Trend</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => (
              <QueueRow
                key={patient.id}
                patient={patient}
                rank={index + 1}
                now={now}
                readOnly={readOnly}
                onAdmit={onAdmit}
                onRecheck={onRecheck}
              />
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
