import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'

// Tiny toast system: wrap the app in <ToastProvider> and call useToast() to get
// a function: const toast = useToast(); toast('Saved', 'success').
const ToastContext = createContext(null)

let counter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, variant = 'primary') => {
      const id = ++counter
      setToasts((list) => [...list, { id, message, variant }])
      setTimeout(() => remove(id), 4000)
      return id
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        position="top-end"
        className="p-3 hs-toasts"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant} autohide delay={4000} onClose={() => remove(t.id)}>
            <Toast.Body className={t.variant === 'warning' || t.variant === 'light' ? 'text-dark' : 'text-white'}>
              {t.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider')
  return ctx
}
