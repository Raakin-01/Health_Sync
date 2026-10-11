// Per-tab alert centre backing the Navbar bell dropdown.
//
// NOT shared between tabs: alerts live in sessionStorage plus a tiny in-memory
// pub/sub, so each tab keeps its own history and unread count. (The shared
// state store is localStorage + BroadcastChannel; alerts are deliberately
// local to the tab.)

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'healthsync:alerts'
const MAX_ALERTS = 10

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let alerts = load()
const listeners = new Set()

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
  } catch {
    // Storage unavailable - keep the list in memory for this page.
  }
}

function emit() {
  for (const listener of [...listeners]) listener()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAlerts() {
  return alerts
}

/** Prepend an alert, cap the history at 10, and return the stored record. */
export function addAlert({ kind, severity, message }) {
  const alert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    severity,
    message,
    at: Date.now(),
    read: false,
  }
  alerts = [alert, ...alerts].slice(0, MAX_ALERTS)
  persist()
  emit()
  return alert
}

export function markAllRead() {
  if (!alerts.some((a) => !a.read)) return
  alerts = alerts.map((a) => ({ ...a, read: true }))
  persist()
  emit()
}

export function clearAlerts() {
  alerts = []
  persist()
  emit()
}

export function unreadCount(list = alerts) {
  return list.filter((a) => !a.read).length
}

export function useAlerts() {
  return useSyncExternalStore(subscribe, getAlerts, getAlerts)
}
