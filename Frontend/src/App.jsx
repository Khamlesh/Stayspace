import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Search from './pages/Search'
import PropertyDetails from './pages/PropertyDetails'
import Booking from './pages/Booking'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import HostLayout from './components/host/HostLayout'
import HostDashboardPage from './pages/host/HostDashboardPage'
import HostPropertiesPage from './pages/host/HostPropertiesPage'
import HostAddPropertyPage from './pages/host/HostAddPropertyPage'
import HostBookingsPage from './pages/host/HostBookingsPage'
import HostEarningsPage from './pages/host/HostEarningsPage'
import HostReportsPage from './pages/host/HostReportsPage'
import HostReviewsPage from './pages/host/HostReviewsPage'
import HostNotificationsPage from './pages/host/HostNotificationsPage'
import HostProfilePage from './pages/host/HostProfilePage'
import HostSettingsPage from './pages/host/HostSettingsPage'
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
          <Route path="/search" element={<Layout><Search /></Layout>} />
          <Route path="/property/:id" element={<Layout><PropertyDetails /></Layout>} />

          <Route element={<ProtectedRoute />}>
            <Route path="/booking/:propertyId" element={<Layout><Booking /></Layout>} />
            <Route path="/payment" element={<Layout><Payment /></Layout>} />
            <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="Host" />}>
            <Route path="/host" element={<HostLayout />}>
              <Route index element={<HostDashboardPage />} />
              <Route path="properties" element={<HostPropertiesPage />} />
              <Route path="add-property" element={<HostAddPropertyPage />} />
              <Route path="bookings" element={<HostBookingsPage />} />
              <Route path="earnings" element={<HostEarningsPage />} />
              <Route path="reports" element={<HostReportsPage />} />
              <Route path="reviews" element={<HostReviewsPage />} />
              <Route path="notifications" element={<HostNotificationsPage />} />
              <Route path="profile" element={<HostProfilePage />} />
              <Route path="settings" element={<HostSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole="Admin" />}>
            <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
