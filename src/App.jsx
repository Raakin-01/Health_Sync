import { Navigate, Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import ForbiddenAlert from './components/ForbiddenAlert.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ToastProvider } from './components/Toasts.jsx'

import Login from './pages/Login.jsx'
import NurseDashboard from './pages/NurseDashboard.jsx'
import DoctorQueue from './pages/DoctorQueue.jsx'
import AdminAnalytics from './pages/AdminAnalytics.jsx'
import NotFound from './pages/NotFound.jsx'

import { useStore } from './lib/store.js'
import { homeForSession } from './lib/roles.js'

// "/" sends you to your role's home, or to login when signed out.
function HomeRedirect() {
  const { session } = useStore()
  return <Navigate to={homeForSession(session)} replace />
}

export default function App() {
  return (
    <ToastProvider>
      <div className="app-shell d-flex flex-column min-vh-100">
        <Navbar />
        <ForbiddenAlert />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allow={['nurse', 'admin']}>
                  <NurseDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/queue"
              element={
                <ProtectedRoute allow={['doctor']}>
                  <DoctorQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allow={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="app-footer text-center text-muted small py-3">
          HealthSync &mdash; Hospital Resource &amp; Bed Management
        </footer>
      </div>
    </ToastProvider>
  )
}
