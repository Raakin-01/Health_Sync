import { Badge, Card, Table } from 'react-bootstrap'

import { levelMeta } from '../lib/triageMeta.js'

/** Colored score + per-vital breakdown (used on intake and re-check). */
export default function ScorePreview({ preview, title = 'Live score preview', sticky = true }) {
  return (
    <Card
      className={`hs-card border-0 shadow-sm${sticky ? ' sticky-lg-top' : ''}`}
      style={sticky ? { top: '5rem' } : undefined}
    >
      <Card.Body className="p-4">
        <div className="text-uppercase small text-muted fw-semibold mb-2">{title}</div>

        {!preview ? (
          <p className="text-muted mb-0">Enter all five vitals to see the score.</p>
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <span className="display-6 fw-bold lh-1">{preview.score}</span>
              <Badge bg={levelMeta(preview.level).variant} className="fs-6">
                {levelMeta(preview.level).label}
              </Badge>
            </div>

            {preview.redFlag && (
              <div className="small text-danger fw-semibold mb-2">
                Red flag: a vital scored the maximum (3) - at least Urgent.
              </div>
            )}

            <Table size="sm" borderless className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Vital</th>
                  <th>Value</th>
                  <th className="text-end">Points</th>
                </tr>
              </thead>
              <tbody>
                {preview.breakdown.map((item) => (
                  <tr key={item.key}>
                    <td>{item.label}</td>
                    <td className="text-muted">{item.formatted}</td>
                    <td className={`text-end fw-semibold ${item.points === 3 ? 'text-danger' : ''}`}>
                      {item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card.Body>
    </Card>
  )
}
