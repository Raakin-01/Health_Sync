import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, ButtonGroup, Modal, Stack } from 'react-bootstrap'

import { WARD_TYPE_META, wardTypeLabel } from '../lib/bedMeta.js'

/** Pick an available (not reserved) bed of a chosen type, grouped by ward. */
export default function AdmitModal({ show, patient, beds, wards, onHide, onConfirm }) {
  const types = useMemo(() => [...new Set(wards.map((w) => w.type))], [wards])
  const [type, setType] = useState(types[0] || 'general')
  const [bedId, setBedId] = useState(null)

  // Reset the selection each time the modal opens.
  useEffect(() => {
    if (show) {
      setType(types[0] || 'general')
      setBedId(null)
    }
  }, [show, patient?.id, types])

  const availableByWard = useMemo(() => {
    const grouped = {}
    for (const bed of beds) {
      if (bed.type !== type || bed.status !== 'available') continue
      grouped[bed.wardId] ??= []
      grouped[bed.wardId].push(bed)
    }
    return grouped
  }, [beds, type])

  const totalFree = Object.values(availableByWard).reduce((sum, list) => sum + list.length, 0)

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">Admit {patient?.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted small mb-2">Bed type</p>
        <ButtonGroup size="sm" className="mb-3 flex-wrap">
          {types.map((t) => (
            <Button
              key={t}
              variant={t === type ? 'primary' : 'outline-primary'}
              onClick={() => { setType(t); setBedId(null) }}
            >
              {wardTypeLabel(t)}
            </Button>
          ))}
        </ButtonGroup>

        {totalFree === 0 ? (
          <Alert variant="warning" className="mb-0">
            No beds available of this type.
          </Alert>
        ) : (
          <Stack gap={3}>
            {wards
              .filter((w) => availableByWard[w.id]?.length)
              .map((ward) => {
                const meta = WARD_TYPE_META[ward.type] || { label: ward.type }
                return (
                  <div key={ward.id}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fw-semibold">{ward.name}</span>
                      <span className="text-muted small">
                        {meta.label} · {availableByWard[ward.id].length} free
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {availableByWard[ward.id].map((bed) => (
                        <Button
                          key={bed.id}
                          size="sm"
                          variant={bedId === bed.id ? 'primary' : 'outline-secondary'}
                          onClick={() => setBedId(bed.id)}
                        >
                          {ward.name} · {bed.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              })}
          </Stack>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" disabled={!bedId} onClick={() => onConfirm(bedId)}>
          Confirm admission
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
