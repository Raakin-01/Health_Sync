import { useMemo, useState } from 'react'
import { Alert, Badge, Col, Container, Form, Row } from 'react-bootstrap'

import BedStatusModal from '../components/BedStatusModal.jsx'
import StatCard from '../components/StatCard.jsx'
import WardCard from '../components/WardCard.jsx'
import { useToast } from '../components/Toasts.jsx'
import { setBedStatus, useStore } from '../lib/store.js'
import { STATUS_META, statusLabel, wardTypeLabel } from '../lib/bedMeta.js'
import { useNow } from '../lib/useNow.js'

export default function NurseDashboard({ readOnly = false }) {
  const { beds, wards, session } = useStore()
  const toast = useToast()
  const now = useNow(15000)

  const [wardId, setWardId] = useState('all')
  const [type, setType] = useState('all')
  const [bedStatus, setBedStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  // Admins get the read-only board everywhere (route + analytics embed).
  const isReadOnly = readOnly || session?.role !== 'nurse'

  const stats = useMemo(() => {
    const total = beds.length
    const available = beds.filter((b) => b.status === 'available').length
    const occupied = beds.filter((b) => b.status === 'occupied').length
    const pct = total ? Math.round((occupied / total) * 100) : 0
    return { total, available, occupied, pct }
  }, [beds])

  const filtered = useMemo(
    () =>
      beds.filter(
        (b) =>
          (wardId === 'all' || b.wardId === wardId) &&
          (type === 'all' || b.type === type) &&
          (bedStatus === 'all' || b.status === bedStatus),
      ),
    [beds, wardId, type, bedStatus],
  )

  // Ward totals come from ALL beds so "X of Y free" is unaffected by filters.
  const wardStats = useMemo(() => {
    const map = {}
    for (const ward of wards) {
      const wardBeds = beds.filter((b) => b.wardId === ward.id)
      map[ward.id] = {
        total: wardBeds.length,
        free: wardBeds.filter((b) => b.status === 'available').length,
      }
    }
    return map
  }, [beds, wards])

  const visibleWards = wards.filter((w) => filtered.some((b) => b.wardId === w.id))
  const selectedBed = selectedId ? beds.find((b) => b.id === selectedId) : null
  const types = [...new Set(wards.map((w) => w.type))]

  function handleChoose(nextStatus) {
    if (!selectedBed) return
    const result = setBedStatus(selectedBed.id, nextStatus)
    if (result.ok) {
      toast(`Bed ${selectedBed.label} set to ${statusLabel(nextStatus)}.`, 'success')
    } else {
      toast(result.error, 'danger')
    }
    setSelectedId(null)
  }

  return (
    <Container fluid="lg" className="py-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-0">Bed Board</h1>
          <p className="text-muted mb-0">Live ward and bed status.</p>
        </div>
        {isReadOnly && <Badge bg="secondary" className="fs-6">Read-only view</Badge>}
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}><StatCard label="Total beds" value={stats.total} /></Col>
        <Col xs={6} lg={3}><StatCard label="Available" value={stats.available} variant="success" /></Col>
        <Col xs={6} lg={3}><StatCard label="Occupied" value={stats.occupied} variant="danger" /></Col>
        <Col xs={6} lg={3}><StatCard label="Occupancy" value={`${stats.pct}%`} variant="primary" /></Col>
      </Row>

      <div className="hs-legend mb-3" aria-label="Bed status legend">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className={`hs-legend__item hs-bed--${key}`}>
            {meta.label}
          </span>
        ))}
      </div>

      <Row className="g-2 mb-4">
        <Col xs={12} md={4}>
          <Form.Label className="small mb-1">Ward</Form.Label>
          <Form.Select value={wardId} onChange={(e) => setWardId(e.target.value)} aria-label="Filter by ward">
            <option value="all">All wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={4}>
          <Form.Label className="small mb-1">Bed type</Form.Label>
          <Form.Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by bed type">
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{wardTypeLabel(t)}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={4}>
          <Form.Label className="small mb-1">Status</Form.Label>
          <Form.Select
            value={bedStatus}
            onChange={(e) => setBedStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {visibleWards.length === 0 ? (
        <Alert variant="info" className="mb-0">No beds match the current filters.</Alert>
      ) : (
        <Row className="g-3">
          {visibleWards.map((ward) => (
            <Col key={ward.id} xs={12} xl={6}>
              <WardCard
                ward={ward}
                beds={filtered.filter((b) => b.wardId === ward.id)}
                total={wardStats[ward.id].total}
                free={wardStats[ward.id].free}
                readOnly={isReadOnly}
                onSelectBed={(bed) => setSelectedId(bed.id)}
                now={now}
              />
            </Col>
          ))}
        </Row>
      )}

      {!isReadOnly && (
        <BedStatusModal
          show={Boolean(selectedBed)}
          bed={selectedBed}
          onHide={() => setSelectedId(null)}
          onChoose={handleChoose}
        />
      )}
    </Container>
  )
}
