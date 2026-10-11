import { useMemo, useState } from 'react'
import { Button, ButtonGroup, Card, Col, Container, Modal, ProgressBar, Row } from 'react-bootstrap'

import EmptyState from '../components/EmptyState.jsx'
import LoadHeatmap from '../components/LoadHeatmap.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import TurnoverChart from '../components/TurnoverChart.jsx'
import WaitTimeChart from '../components/WaitTimeChart.jsx'
import { useToast } from '../components/Toasts.jsx'
import {
  buildInsights,
  currentOccupancy,
  liveAverageWait,
  mockAverageWait,
  mockCleaning,
  mockTurnover,
  occupancyByWard,
  reportCsv,
  turnoverForWard,
  waitForLevel,
  waitingNow,
} from '../lib/reportMetrics.js'
import { RANGE_LABELS } from '../data/reportData.js'
import { reset, useStore } from '../lib/store.js'
import { useDocumentTitle } from '../lib/useDocumentTitle.js'

export default function AdminAnalytics() {
  useDocumentTitle('Analytics')
  const { beds, wards, patients } = useStore()
  const toast = useToast()
  const [range, setRange] = useState('today')
  const [showReset, setShowReset] = useState(false)

  const liveAvgWait = liveAverageWait(patients)
  const avgWait = liveAvgWait ?? mockAverageWait(range)

  const perWard = useMemo(() => occupancyByWard(beds, wards), [beds, wards])

  const waitData = {
    'non-urgent': waitForLevel(range, 'non-urgent'),
    urgent: waitForLevel(range, 'urgent'),
    critical: waitForLevel(range, 'critical'),
  }
  const turnoverData = Object.fromEntries(wards.map((w) => [w.id, turnoverForWard(range, w.id)]))

  const wardRows = wards.map((ward) => ({
    name: ward.name,
    occupancy: perWard.find((w) => w.wardId === ward.id)?.occupancy ?? 0,
    waitToday: mockAverageWait('today'),
    waitWeek: mockAverageWait('week'),
    turnoverToday: turnoverForWard('today', ward.id),
    turnoverWeek: turnoverForWard('week', ward.id),
  }))

  const summary = [
    { label: 'Current occupancy %', value: `${currentOccupancy(beds)}%`, source: 'live' },
    { label: 'Patients waiting now', value: String(waitingNow(patients)), source: 'live' },
    { label: 'Average wait time', value: `${avgWait} min`, source: liveAvgWait != null ? 'live' : 'demo data' },
    { label: 'Bed turnover rate', value: `${mockTurnover(range)} stays/bed`, source: 'demo data' },
    { label: 'Avg cleaning time', value: `${mockCleaning(range)} min`, source: 'demo data' },
  ]

  const insights = useMemo(() => buildInsights({ beds, wards, range }), [beds, wards, range])

  function downloadCsv() {
    const csv = reportCsv(range, summary, wardRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `healthsync-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function barVariant(percent) {
    if (percent >= 90) return 'danger'
    if (percent >= 80) return 'warning'
    return 'primary'
  }

  function handleReset() {
    reset()
    setShowReset(false)
    toast('Demo data has been reset.', 'success')
  }

  return (
    <Container fluid="lg" className="py-4">
      <PageHeader
        title="Admin Analytics"
        subtitle={
          <>
            Occupancy, waiting times and ward load.{' '}
            <span className="badge text-bg-warning">demo data</span> figures are historical mock values.
          </>
        }
        actions={
          <>
            <ButtonGroup aria-label="Analytics range">
              {Object.entries(RANGE_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant={range === key ? 'primary' : 'outline-primary'}
                  size="sm"
                  active={range === key}
                  onClick={() => setRange(key)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
            <Button variant="success" size="sm" onClick={downloadCsv}>Export report (CSV)</Button>
            <Button variant="outline-danger" size="sm" onClick={() => setShowReset(true)}>
              Reset demo data
            </Button>
          </>
        }
      />

      <Row className="g-3 mb-4">
        {summary.map((s) => (
          <Col xs={6} md={4} key={s.label}>
            <StatCard label={s.label} value={s.value} hint={s.source} />
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        <Col xs={12} lg={6}>
          <Card className="hs-card border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold d-flex justify-content-between align-items-center">
              <span>Average wait time by triage level</span>
              <span className="badge text-bg-warning">demo data</span>
            </Card.Header>
            <Card.Body>
              <WaitTimeChart data={waitData} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="hs-card border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold d-flex justify-content-between align-items-center">
              <span>Bed turnover by ward</span>
              <span className="badge text-bg-warning">demo data</span>
            </Card.Header>
            <Card.Body>
              <TurnoverChart wards={wards} data={turnoverData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mb-4">
        <LoadHeatmap wards={wards} />
      </div>

      <Row className="g-3">
        <Col xs={12} lg={7}>
          <Card className="hs-card border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold">
              Live occupancy by ward <span className="badge text-bg-success">live</span>
            </Card.Header>
            <Card.Body>
              {perWard.length === 0 ? (
                <EmptyState
                  bare
                  variant="secondary"
                  title="No wards to show"
                  message="Ward occupancy appears once wards are configured."
                />
              ) : (
                <>
                  {perWard.map((w) => (
                    <div key={w.wardId} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{w.name}</span>
                        <span className="text-muted">{w.occupancy}% - {w.occupied}/{w.total} beds</span>
                      </div>
                      <ProgressBar now={w.occupancy} variant={barVariant(w.occupancy)} />
                    </div>
                  ))}
                  <p className="text-muted small mb-0 mt-2">
                    <b className="text-warning">*</b> &gt;= 80% &nbsp; <b className="text-danger">*</b> &gt;= 90%. Updates live from the bed store.
                  </p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={5}>
          <Card className="hs-card border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold">Insights</Card.Header>
            <Card.Body>
              {insights.length === 0 ? (
                <EmptyState
                  bare
                  variant="secondary"
                  title="No insights yet"
                  message="Insights appear once there is occupancy data to analyse."
                />
              ) : (
                <ul className="mb-0 ps-3">
                  {insights.map((sentence, i) => (
                    <li key={i} className="mb-2">{sentence}</li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showReset} onHide={() => setShowReset(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 mb-0">Reset demo data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This restores the seeded wards, beds and patients, and clears the current queue.
          Your login in this tab is kept. This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReset}>Reset data</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}