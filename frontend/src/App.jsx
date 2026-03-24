import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import Practice   from './pages/Practice'
import Compete    from './pages/Compete'
import Result     from './pages/Result'
import History    from './pages/History'
import Admin      from './pages/Admin'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/practice"  element={<PrivateRoute><Practice /></PrivateRoute>} />
          <Route path="/compete"   element={<PrivateRoute><Compete /></PrivateRoute>} />
          <Route path="/result/:attemptId" element={<PrivateRoute><Result /></PrivateRoute>} />
          <Route path="/history"   element={<PrivateRoute><History /></PrivateRoute>} />

          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
