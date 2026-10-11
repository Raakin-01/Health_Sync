import { Dropdown } from 'react-bootstrap'

import { markAllRead, unreadCount, useAlerts } from '../lib/alertCenter.js'

function timeLabel(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// Bell button + dropdown listing this tab's recent alerts (newest first).
// Icon-only, so it carries an aria-label that includes the unread count.
export default function AlertBell() {
  const alerts = useAlerts()
  const unread = unreadCount(alerts)

  return (
    <Dropdown align="end" className="hs-alert-bell">
      <Dropdown.Toggle
        as="button"
        type="button"
        id="hs-alert-bell"
        className="btn btn-outline-light btn-sm hs-alert-toggle position-relative"
        aria-label={unread > 0 ? `Alerts, ${unread} unread` : 'Alerts'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="hs-alert-badge badge rounded-pill bg-danger">{unread}</span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="hs-alert-menu">
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <span className="fw-semibold">Alerts</span>
          {alerts.length > 0 && (
            <button type="button" className="btn btn-link btn-sm p-0" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <Dropdown.ItemText className="text-muted small py-3 text-center">
            No alerts yet
          </Dropdown.ItemText>
        ) : (
          <div className="hs-alert-list">
            {alerts.map((alert) => (
              <Dropdown.ItemText
                key={alert.id}
                className="d-flex gap-2 align-items-start hs-alert-item py-2"
              >
                <span className={`hs-alert-dot hs-alert-dot--${alert.severity}`} aria-hidden="true" />
                <span className="flex-grow-1">
                  <span className={alert.read ? 'text-muted' : 'fw-semibold'}>{alert.message}</span>
                  <span className="d-block text-muted small">{timeLabel(alert.at)}</span>
                </span>
              </Dropdown.ItemText>
            ))}
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  )
}
