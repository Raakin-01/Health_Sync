import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap'

import { addPatient } from '../lib/store.js'
import { useToast } from './Toasts.jsx'
import ScorePreview from './ScorePreview.jsx'
import VitalsFields from './VitalsFields.jsx'
import { scoreVitals, validateAge, validateVitals } from '../lib/triage.js'
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
    toast(`${patient.name} added - score ${patient.score} (${meta.label}).`, meta.variant)
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

                <VitalsFields
                  values={values}
                  errors={errors}
                  invalid={invalid}
                  onChange={set}
                  onBlur={markTouched}
                  idPrefix="intake"
                />
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
