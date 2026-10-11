import { Badge, Card, ProgressBar } from 'react-bootstrap'

import BedTile from './BedTile.jsx'
import { WARD_TYPE_META } from '../lib/bedMeta.js'

/**
 * One ward: name, type badge, "X of Y free" summary strip, and the bed grid.
 * `total`/`free` describe the WHOLE ward (so the summary stays true even when
 * the tiles below are filtered).
 */
export default function WardCard({ ward, beds, total, free, readOnly, onSelectBed, now }) {
  const inUse = total - free
  const pct = total ? Math.round((inUse / total) * 100) : 0
  const typeMeta = WARD_TYPE_META[ward.type] || { label: ward.type, variant: 'secondary' }

  return (
    <Card className="hs-card border-0 shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
          <div>
            <h2 className="h6 mb-1">{ward.name}</h2>
            <Badge bg={typeMeta.variant}>{typeMeta.label}</Badge>
          </div>
          <div className="text-end">
            <div className="fw-semibold">{free} of {total} free</div>
            <small className="text-muted">{pct}% in use</small>
          </div>
        </div>

        <ProgressBar
          now={pct}
          variant={pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'success'}
          className="hs-ward-progress"
          aria-label={`${ward.name} ${pct}% in use`}
        />

        <div className="hs-bed-grid">
          {beds.map((bed) => (
            <BedTile key={bed.id} bed={bed} readOnly={readOnly} now={now} onSelect={onSelectBed} />
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}
