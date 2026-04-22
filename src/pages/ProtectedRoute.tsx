import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { isSignedIn, isBootstrapping } = useAuth()
  if (isBootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bw-sand-100 text-sm text-bw-muted">
        Loading your session…
      </div>
    )
  }
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  return <Outlet />
}
