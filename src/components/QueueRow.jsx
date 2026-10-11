import { Badge, Button } from 'react-bootstrap'

import { formatWait, minutesWaited, trendOf } from '../lib/queue.js'
import { levelMeta } from '../lib/triageMeta.js'

const TREND = {
  up: { arrow: '^', text: 'Worsening', variant: 'text-danger' },
  down: { arrow: 'v', text: 'Improving', variant: 'text-success' },
  flat: { arrow: '->', text: 'Stable', variant: 'text-muted' },
  null: { arrow: '-', text: 'No re-checks', variant: 'text-muted' },
}

function VitalsSummary({ vitals }) {
  if (!vitals) return null
  return (
    <span className="text-muted small">
      RR {vitals.rr}, SpO2 {vitals.spo2}%, BP {vitals.sbp}, HR {vitals.hr}, {vitals.temp}C,{' '}
      {vitals.consciousness}
    </span>
  )
}

export default function QueueRow({ patient, rank, now, readOnly, onAdmit, onRecheck }) {
  const meta = levelMeta(patient.level)
  const trend = trendOf(patient)
  const trendMeta = TREND[trend.direction] || TREND.null

  return (
    <tr>
      <td className="fw-bold">{rank}</td>
      <td>
        <div className="fw-semibold">{patient.name}</div>
        <div className="text-muted small">
          {patient.age != null ? `${patient.age} yrs` : 'Age n/a'}
          {patient.gender ? ` - ${patient.gender}` : ''}
        </div>
      </td>
      <td className="small" style={{ minWidth: '10rem' }}>{patient.chiefComplaint || '-'}</td>
      <td><Badge bg={meta.variant}>{meta.label}</Badge></td>
      <td className="text-center fw-semibold">{patient.score}</td>
      <td className="text-center">{patient.effectivePriority.toFixed(1)}</td>
      <td className="text-nowrap">{formatWait(minutesWaited(patient.arrivedAt, now))}</td>
      <td style={{ minWidth: '14rem' }}><VitalsSummary vitals={patient.vitals} /></td>
      <td className={`text-nowrap fw-semibold ${trendMeta.variant}`}>
        {trendMeta.arrow} {trend.direction ? trendMeta.text : ''}
      </td>
      <td className="text-nowrap">
        <div className="d-flex gap-2">
          <Button size="sm" variant="primary" disabled={readOnly} onClick={() => onAdmit(patient)}>
            Admit
          </Button>
          <Button size="sm" variant="outline-secondary" disabled={readOnly} onClick={() => onRecheck(patient)}>
            Re-check
          </Button>
        </div>
      </td>
    </tr>
  )
}
