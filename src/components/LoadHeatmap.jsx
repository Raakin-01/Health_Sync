import { useMemo } from 'react'
import { Card } from 'react-bootstrap'

import { heatmapColor, hourlyForWard } from '../lib/reportMetrics.js'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function LoadHeatmap({ wards }) {
  const rows = useMemo(
    () =>
      wards.map((ward) => ({ ward, hours: hourlyForWard(ward.id) })),
    [wards],
  )

  return (
    <Card className="hs-card border-0 shadow-sm h-100">
      <Card.Header className="bg-white fw-semibold">Department load - occupancy by hour (%)</Card.Header>
      <Card.Body className="pt-3">
        <div className="table-responsive">
          <table className="table table-sm hs-heatmap mb-0">
            <thead>
              <tr>
                <th className="position-sticky start-0 bg-white">Ward</th>
                {HOURS.map((h) => (
                  <th key={h} className="text-center fw-light">{String(h).padStart(2, '0')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ ward, hours }) => (
                <tr key={ward.id}>
                  <td className="position-sticky start-0 bg-white text-nowrap fw-semibold small">{ward.name}</td>
                  {HOURS.map((h) => {
                    const value = hours[h] ?? 0
                    const high = value >= 90
                    return (
                      <td
                        key={h}
                        className="text-center hs-heat-cell"
                        style={{ backgroundColor: heatmapColor(value), color: high ? '#fff' : '#1f2937' }}
                        title={`${value}%`}
                        aria-label={`${ward.name}: ${String(h).padStart(2, '0')}:00 ${value}%`}
                      >
                        <span className={high ? 'fw-bold' : ''}>{value}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-3 small text-muted gap-2 flex-wrap">
          <span>Low</span>
          {[0, 25, 50, 75, 100].map((p) => (
            <span
              key={p}
              className="hs-heat-swatch border"
              style={{ backgroundColor: heatmapColor(p) }}
              title={`${p}%`}
              aria-label={`${p}% occupancy`}
            />
          ))}
          <span>High</span>
          <span className="ms-auto"><b className="text-danger">*</b> &gt;= 90%</span>
        </div>
      </Card.Body>
    </Card>
  )
}