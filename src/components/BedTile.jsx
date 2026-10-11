import { STATUS_META } from '../lib/bedMeta.js'

/**
 * A single bed. Colored + text-labelled (never color alone). Rendered as a
 * <button> when interactive so it is keyboard accessible; a plain <div> in
 * read-only views.
 */
export default function BedTile({ bed, readOnly = false, now = Date.now(), onSelect }) {
  const meta = STATUS_META[bed.status] || { label: bed.status }
  const minutesLeft =
    bed.status === 'reserved' && bed.expiresAt
      ? Math.max(0, Math.ceil((bed.expiresAt - now) / 60000))
      : null

  const label = `Bed ${bed.label}, ${meta.label}${minutesLeft != null ? `, ${minutesLeft} minutes left` : ''}`
  const className = `hs-bed hs-bed--${bed.status}`

  const content = (
    <>
      <span className="hs-bed__id">{bed.label}</span>
      <span className="hs-bed__status">{meta.label}</span>
      {minutesLeft != null && <span className="hs-bed__timer">{minutesLeft}m left</span>}
    </>
  )

  if (readOnly) {
    return (
      <div className={className} aria-label={label}>
        {content}
      </div>
    )
  }

  return (
    <button type="button" className={className} aria-label={label} title={label} onClick={() => onSelect?.(bed)}>
      {content}
    </button>
  )
}
