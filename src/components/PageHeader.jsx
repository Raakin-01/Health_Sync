// Consistent page heading used on every page: a title, an optional subtitle and
// an optional right-hand action area. `align="center"` is used by the auth and
// not-found pages.
export default function PageHeader({ title, subtitle, actions, align = 'start' }) {
  const centered = align === 'center'

  return (
    <header
      className={`hs-page-header mb-4 d-flex flex-wrap gap-2 ${
        centered ? 'flex-column align-items-center text-center' : 'justify-content-between align-items-start'
      }`}
    >
      <div>
        <h1 className="hs-page-title mb-1">{title}</h1>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {actions && (
        <div className={`d-flex gap-2 flex-wrap align-items-center ${centered ? 'justify-content-center' : ''}`}>
          {actions}
        </div>
      )}
    </header>
  )
}
