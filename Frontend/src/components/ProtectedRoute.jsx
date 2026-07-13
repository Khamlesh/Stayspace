import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const PendingApproval = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-main-text mb-2">Account Pending Approval</h1>
      <p className="text-secondary-text mb-6">
        Your host account is currently awaiting admin approval. You will be able to access the Host Dashboard once your account is approved.
      </p>
      <p className="text-sm text-secondary-text mb-6">
        This usually takes 24-48 hours. You will receive a notification once approved.
      </p>
      <button
        onClick={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }}
        className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
      >
        Back to Login
      </button>
    </div>
  </div>
)

const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  if (requiredRole === 'Host' && user?.role === 'Host' && user?.is_approved === false) {
    return <PendingApproval />
  }

  return <Outlet />
}

export default ProtectedRoute
