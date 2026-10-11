import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'

import { addPatient } from '../lib/store.js'
import { useToast } from './Toasts.jsx'
import { CONSCIOUSNESS_LEVELS, scoreVitals, validateAge, validateVitals } from '../lib/triage.js'
import { levelMeta } from '../lib/triageMeta.js'

const EMPTY = {
  name: '',
  age: '',
  gender: 'Female',
  chiefComplaint: '',
  rr: '',
  spo2: '',
  sbp: '',
  hr: '',
  temp: '',
  consciousness: 'Alert',
}

// Demo presets from the plan (expected scores 17 / 5 / 0).
const PRESETS = {
  critical: { rr: '26', spo2: '90', sbp: '85', hr: '135', temp: '39.5', consciousness: 'Voice' },
  urgent: { rr: '22', spo2: '95', sbp: '120', hr: '100', temp: '38.4', consciousness: 'Alert' },
  'non-urgent': { rr: '16', spo2: '98', sbp: '125', hr: '78', temp: '36.8', consciousness: 'Alert' },
}

const NUMERIC_FIELDS = [
  { key: 'rr', label: 'Respiratory rate', unit: '/min', min: 4, max: 60, step: 1 },
  { key: 'spo2', label: 'SpO₂', unit: '%', min: 50, max: 100, step: 1 },
  { key: 'sbp', label: 'Systolic BP', unit: 'mmHg', min: 40, max: 300, step: 1 },
  { key: 'hr', label: 'Heart rate', unit: '/min', min: 20, max: 250, step: 1 },
  { key: 'temp', label: 'Temperature', unit: '°C', min: 30, max: 45, step: 0.1 },
]

function toVitalNumbers(values) {
  return {
    rr: Number(values.rr),
    spo2: Number(values.spo2),
    sbp: Number(values.sbp),
    hr: Number(values.hr),
    temp: Number(values.temp),
    consciousness: values.consciousness,
  }
}

export default function TriageForm() {
  const toast = useToast()
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [lastSubmitted, setLastSubmitted] = useState(null)

  const errors = useMemo(() => {
    const vitalsErrors = validateVitals(values)
    const ageError = validateAge(values.age)
    return ageError ? { ...vitalsErrors, age: ageError } : vitalsErrors
  }, [values])

  const invalid = (key) => (touched[key] || submitted) && Boolean(errors[key])

  const hasAllVitals = ['rr', 'spo2', 'sbp', 'hr', 'temp'].every(
    (key) => values[key] !== '' && Number.isFinite(Number(values[key])),
  )
  const preview = hasAllVitals ? scoreVitals(toVitalNumbers(values)) : null

  function set(key, value) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function markTouched(key) {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  function applyPreset(name) {
    setValues((v) => ({ ...v, ...PRESETS[name] }))
    setTouched({})
    setSubmitted(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      toast('Please fix the highlighted fields.', 'danger')
      return
    }

    const patient = addPatient({
      name: values.name,
      age: values.age,
      gender: values.gender,
      chiefComplaint: values.chiefComplaint,
      vitals: toVitalNumbers(values),
    })

    const meta = levelMeta(patient.level)
    toast(`${patient.name} added — score ${patient.score} (${meta.label}).`, meta.variant)
    setLastSubmitted(patient)
    setValues(EMPTY)
    setTouched({})
    setSubmitted(false)
  }

  return (
    <Row className="g-4">
      <Col xs={12} lg={7}>
        <Card className="hs-card border-0 shadow-sm">
          <Card.Body className="p-4">
            <h2 className="h5 mb-1">New patient intake</h2>
            <p className="text-muted small mb-3">
              Enter the patient's details and vitals. The score preview updates as you type.
            </p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button size="sm" variant="outline-danger" onClick={() => applyPreset('critical')}>
                Fill: Critical example
              </Button>
              <Button size="sm" variant="outline-warning" onClick={() => applyPreset('urgent')}>
                Fill: Urgent example
              </Button>
              <Button size="sm" variant="outline-success" onClick={() => applyPreset('non-urgent')}>
                Fill: Non-urgent example
              </Button>
            </div>

            <Form noValidate onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col xs={12} md={8}>
                  <Form.Group controlId="intakeName">
                    <Form.Label>Name <span className="text-muted">(optional)</span></Form.Label>
                    <Form.Control
                      value={values.name}
                      onChange={(e) => set('name', e.target.value)}
                      onBlur={() => markTouched('name')}
                      placeholder="Leave blank for Unknown Patient"
                      isInvalid={invalid('name')}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={6} md={2}>
                  <Form.Group controlId="intakeAge">
                    <Form.Label>Age</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      max={120}
                      value={values.age}
                      onChange={(e) => set('age', e.target.value)}
                      onBlur={() => markTouched('age')}
                      isInvalid={invalid('age')}
                    />
                    <Form.Control.Feedback type="invalid">{errors.age}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={6} md={2}>
                  <Form.Group controlId="intakeGender">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select value={values.gender} onChange={(e) => set('gender', e.target.value)}>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12}>
                  <Form.Group controlId="intakeComplaint">
                    <Form.Label>Chief complaint <span className="text-muted">(optional)</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={values.chiefComplaint}
                      onChange={(e) => set('chiefComplaint', e.target.value)}
                      placeholder="e.g. Shortness of breath"
                    />
                  </Form.Group>
                </Col>

                {NUMERIC_FIELDS.map((field) => (
                  <Col xs={6} md={4} key={field.key}>
                    <Form.Group controlId={`intake-${field.key}`}>
                      <Form.Label>
                        {field.label} <span className="text-muted">({field.unit})</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={values[field.key]}
                        onChange={(e) => set(field.key, e.target.value)}
                        onBlur={() => markTouched(field.key)}
                        isInvalid={invalid(field.key)}
                      />
                      <Form.Control.Feedback type="invalid">{errors[field.key]}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                ))}

                <Col xs={12} md={6}>
                  <Form.Group controlId="intakeConsciousness">
                    <Form.Label>Consciousness</Form.Label>
                    <Form.Select
                      value={values.consciousness}
                      onChange={(e) => set('consciousness', e.target.value)}
                      onBlur={() => markTouched('consciousness')}
                      isInvalid={invalid('consciousness')}
                    >
                      {CONSCIOUSNESS_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.consciousness}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-grid d-sm-flex gap-2 mt-4">
                <Button type="submit" variant="primary">Add patient to queue</Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => { setValues(EMPTY); setTouched({}); setSubmitted(false) }}
                >
                  Clear
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col xs={12} lg={5}>
        <ScorePreview preview={preview} />

        {lastSubmitted && (
          <Card className="hs-card border-0 shadow-sm mt-4">
            <Card.Body>
              <div className="text-uppercase small text-muted fw-semibold mb-2">Last submitted</div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{lastSubmitted.name}</div>
                  <div className="text-muted small">Score {lastSubmitted.score}</div>
                </div>
                <Badge bg={levelMeta(lastSubmitted.level).variant}>
                  {levelMeta(lastSubmitted.level).label}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  )
}

function ScorePreview({ preview }) {
  return (
    <Card className="hs-card border-0 shadow-sm sticky-lg-top" style={{ top: '5rem' }}>
      <Card.Body className="p-4">
        <div className="text-uppercase small text-muted fw-semibold mb-2">Live score preview</div>

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
                Red flag: a vital scored the maximum (3) — at least Urgent.
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
