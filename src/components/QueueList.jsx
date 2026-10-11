import { Alert, Card, Table } from 'react-bootstrap'

import QueueRow from './QueueRow.jsx'

/** Priority-ordered waiting list. Horizontally scrolls on narrow screens. */
export default function QueueList({ patients, now, readOnly, onAdmit, onRecheck }) {
  if (patients.length === 0) {
    return <Alert variant="info" className="mb-0">No patients waiting. Add one from the Intake page.</Alert>
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
