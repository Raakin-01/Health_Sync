import { useMemo, useState } from 'react'
import { Accordion, Badge, Card, Col, Container, Row } from 'react-bootstrap'

import AdmitModal from '../components/AdmitModal.jsx'
import QueueList from '../components/QueueList.jsx'
import RecheckModal from '../components/RecheckModal.jsx'
import StatCard from '../components/StatCard.jsx'
import { useToast } from '../components/Toasts.jsx'
import { admitPatient, reassessPatient, useStore } from '../lib/store.js'
import { formatWait, minutesWaited, queueOrder } from '../lib/queue.js'
import { levelMeta } from '../lib/triageMeta.js'
import { useNow } from '../lib/useNow.js'

export default function DoctorQueue() {
  const { patients, beds, wards, session } = useStore()
  const toast = useToast()
  const now = useNow(30000)

  const [admitTarget, setAdmitTarget] = useState(null)
  const [recheckTarget, setRecheckTarget] = useState(null)

  const readOnly = session?.role !== 'doctor'

  // Rebuild the heap (with a single `now`) whenever data or the clock changes.
  const ordered = useMemo(
    () => queueOrder(patients.filter((p) => p.status === 'waiting'), now),
    [patients, now],
  )

  const criticalCount = ordered.filter((p) => p.level === 'critical').length
  const longestWait = ordered.reduce((max, p) => Math.max(max, minutesWaited(p.arrivedAt, now)), 0)
  const nextUp = ordered[0]

  function bedLabel(bedId) {
    const bed = beds.find((b) => b.id === bedId)
    return bed ? `${bed.wardId} · ${bed.label}` : bedId
  }

  function handleAdmit(bedId) {
    const result = admitPatient(admitTarget.id, bedId)
    if (result.ok) toast(`${result.patient.name} admitted to ${bedLabel(bedId)}.`, 'success')
    else toast(result.error, 'danger')
    setAdmitTarget(null)
  }

  function handleRecheck(vitals) {
    const result = reassessPatient(recheckTarget.id, vitals)
    if (!result.ok) {
      toast(result.error, 'danger')
      return
    }
    const delta = result.patient.score - result.previousScore
    const name = result.patient.name
    if (delta >= 3) {
      toast(`${name}: ${result.previousScore} → ${result.patient.score}. Deteriorating patient.`, 'danger')
    } else if (delta > 0) {
      toast(`${name}: score up ${result.previousScore} → ${result.patient.score}.`, 'warning')
    } else if (delta < 0) {
      toast(`${name}: improving ${result.previousScore} → ${result.patient.score}.`, 'success')
    } else {
      toast(`${name}: score unchanged (${result.patient.score}).`, 'primary')
    }
    setRecheckTarget(null)
  }

  return (
    <Container fluid="lg" className="py-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-0">Doctor Queue</h1>
          <p className="text-muted mb-0">Patients ranked by severity and waiting time.</p>
        </div>
        {readOnly && <Badge bg="secondary" className="fs-6">Read-only view</Badge>}
      </div>

      <Row className="g-3 mb-4">
        <Col xs={4} lg={3}><StatCard label="Waiting" value={ordered.length} /></Col>
        <Col xs={4} lg={3}><StatCard label="Critical" value={criticalCount} variant="danger" /></Col>
        <Col xs={4} lg={3}><StatCard label="Longest wait" value={formatWait(longestWait)} variant="warning" /></Col>
        <Col xs={12} lg={3}>
          <Card className="hs-card border-0 shadow-sm h-100">
            <Card.Body className="py-3">
              <div className="text-uppercase small text-muted fw-semibold">Next up</div>
              <div className="fs-5 fw-bold lh-1 my-1">{nextUp ? nextUp.name : '—'}</div>
              {nextUp && (
                <div className="text-muted small">
                  Score {nextUp.score} · {levelMeta(nextUp.level).label}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Accordion className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>How is this ordered?</Accordion.Header>
          <Accordion.Body className="text-muted small">
            <p className="mb-2">
              <strong>Effective priority = triage score + 0.1 × minutes waited.</strong> The longer a
              patient waits, the higher they climb, so no one is starved. Ties go to the first to
              arrive.
            </p>
            <p className="mb-0">
              Implemented with a max-heap (<code>lib/heap.js</code>): insert and extract are
              <code> O(log n)</code>, peek is <code>O(1)</code>. The list is rebuilt with a single
              timestamp so all comparisons use the same clock.
            </p>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <QueueList
        patients={ordered}
        now={now}
        readOnly={readOnly}
        onAdmit={setAdmitTarget}
        onRecheck={setRecheckTarget}
      />

      <AdmitModal
        show={Boolean(admitTarget)}
        patient={admitTarget}
        beds={beds}
        wards={wards}
        onHide={() => setAdmitTarget(null)}
        onConfirm={handleAdmit}
      />

      <RecheckModal
        show={Boolean(recheckTarget)}
        patient={recheckTarget}
        onHide={() => setRecheckTarget(null)}
        onSave={handleRecheck}
      />
    </Container>
  )
}
