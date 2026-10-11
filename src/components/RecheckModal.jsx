import { useEffect, useMemo, useState } from 'react'
import { Button, Col, Modal, Row } from 'react-bootstrap'

import ScorePreview from './ScorePreview.jsx'
import VitalsFields from './VitalsFields.jsx'
import { useToast } from './Toasts.jsx'
import { scoreVitals, validateVitals } from '../lib/triage.js'

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

const BLANK = { rr: '', spo2: '', sbp: '', hr: '', temp: '', consciousness: 'Alert' }

export default function RecheckModal({ show, patient, onHide, onSave }) {
  const toast = useToast()
  const [values, setValues] = useState(BLANK)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (show && patient) {
      const v = patient.vitals || {}
      setValues({
        rr: v.rr != null ? String(v.rr) : '',
        spo2: v.spo2 != null ? String(v.spo2) : '',
        sbp: v.sbp != null ? String(v.sbp) : '',
        hr: v.hr != null ? String(v.hr) : '',
        temp: v.temp != null ? String(v.temp) : '',
        consciousness: v.consciousness || 'Alert',
      })
      setTouched({})
      setSubmitted(false)
    }
  }, [show, patient?.id])

  const errors = useMemo(() => validateVitals(values), [values])
  const invalid = (key) => (touched[key] || submitted) && Boolean(errors[key])

  const hasAllVitals = ['rr', 'spo2', 'sbp', 'hr', 'temp'].every(
    (key) => values[key] !== '' && Number.isFinite(Number(values[key])),
  )
  const preview = hasAllVitals ? scoreVitals(toVitalNumbers(values)) : null

  function handleSave() {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      toast('Please fix the highlighted fields.', 'danger')
      return
    }
    onSave(toVitalNumbers(values))
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">Re-check vitals - {patient?.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="g-4">
          <Col xs={12} md={7}>
            <Row className="g-3">
              <VitalsFields
                values={values}
                errors={errors}
                invalid={invalid}
                onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
                onBlur={(key) => setTouched((t) => ({ ...t, [key]: true }))}
                idPrefix="recheck"
              />
            </Row>
          </Col>
          <Col xs={12} md={5}>
            <ScorePreview preview={preview} title="Updated score" sticky={false} />
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save re-check</Button>
      </Modal.Footer>
    </Modal>
  )
}
