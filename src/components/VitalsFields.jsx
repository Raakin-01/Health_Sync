import { Col, Form } from 'react-bootstrap'

import { CONSCIOUSNESS_LEVELS } from '../lib/triage.js'

// Shared vitals form fields (used by both the intake form and the re-check modal).
export const NUMERIC_FIELDS = [
  { key: 'rr', label: 'Respiratory rate', unit: '/min', min: 4, max: 60, step: 1 },
  { key: 'spo2', label: 'SpO2', unit: '%', min: 50, max: 100, step: 1 },
  { key: 'sbp', label: 'Systolic BP', unit: 'mmHg', min: 40, max: 300, step: 1 },
  { key: 'hr', label: 'Heart rate', unit: '/min', min: 20, max: 250, step: 1 },
  { key: 'temp', label: 'Temperature', unit: 'C', min: 30, max: 45, step: 0.1 },
]

export default function VitalsFields({ values, errors = {}, invalid, onChange, onBlur, idPrefix = 'vital' }) {
  const isInvalid = invalid || ((key) => Boolean(errors[key]))

  return (
    <>
      {NUMERIC_FIELDS.map((field) => (
        <Col xs={6} md={4} key={field.key}>
          <Form.Group controlId={`${idPrefix}-${field.key}`}>
            <Form.Label>
              {field.label} <span className="text-muted">({field.unit})</span>
            </Form.Label>
            <Form.Control
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              onBlur={() => onBlur(field.key)}
              isInvalid={isInvalid(field.key)}
            />
            <Form.Control.Feedback type="invalid">{errors[field.key]}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      ))}

      <Col xs={12} md={6}>
        <Form.Group controlId={`${idPrefix}-consciousness`}>
          <Form.Label>Consciousness</Form.Label>
          <Form.Select
            value={values.consciousness}
            onChange={(e) => onChange('consciousness', e.target.value)}
            onBlur={() => onBlur('consciousness')}
            isInvalid={isInvalid('consciousness')}
          >
            {CONSCIOUSNESS_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errors.consciousness}</Form.Control.Feedback>
        </Form.Group>
      </Col>
    </>
  )
}
