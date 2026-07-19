import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
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
import HostComplaintsPage from './pages/host/HostComplaintsPage'
import HostChatPage from './pages/host/HostChatPage'
import UserLayout from './components/user/UserLayout'
import UserDashboardPage from './pages/user/UserDashboardPage'
import UserExplorePage from './pages/user/UserExplorePage'
import UserWishlistPage from './pages/user/UserWishlistPage'
import UserBookingsPage from './pages/user/UserBookingsPage'
import UserPaymentsPage from './pages/user/UserPaymentsPage'
import UserReviewsPage from './pages/user/UserReviewsPage'
import UserNotificationsPage from './pages/user/UserNotificationsPage'
import UserProfilePage from './pages/user/UserProfilePage'
import UserSettingsPage from './pages/user/UserSettingsPage'
import UserComplaintsPage from './pages/user/UserComplaintsPage'
import UserChatPage from './pages/user/UserChatPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminHostsPage from './pages/admin/AdminHostsPage'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminProfilePage from './pages/admin/AdminProfilePage'
import AdminChatPage from './pages/admin/AdminChatPage'
import './index.css'

function App() {
  return (
    <Router>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px' } }} />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/search" element={<Layout><Search /></Layout>} />
          <Route path="/property/:id" element={<Layout><PropertyDetails /></Layout>} />

          <Route element={<ProtectedRoute />}>
            <Route path="/booking/:propertyId" element={<Layout><Booking /></Layout>} />
            <Route path="/payment" element={<Layout><Payment /></Layout>} />
            <Route path="/payment-success" element={<Layout><PaymentSuccess /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="Guest" />}>
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<UserDashboardPage />} />
              <Route path="explore" element={<UserExplorePage />} />
              <Route path="wishlist" element={<UserWishlistPage />} />
              <Route path="bookings" element={<UserBookingsPage />} />
              <Route path="messages" element={<UserChatPage />} />
              <Route path="payments" element={<UserPaymentsPage />} />
              <Route path="reviews" element={<UserReviewsPage />} />
              <Route path="notifications" element={<UserNotificationsPage />} />
              <Route path="complaints" element={<UserComplaintsPage />} />
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="settings" element={<UserSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole="Host" />}>
            <Route path="/host" element={<HostLayout />}>
              <Route index element={<HostDashboardPage />} />
              <Route path="properties" element={<HostPropertiesPage />} />
              <Route path="add-property" element={<HostAddPropertyPage />} />
              <Route path="bookings" element={<HostBookingsPage />} />
              <Route path="messages" element={<HostChatPage />} />
              <Route path="earnings" element={<HostEarningsPage />} />
              <Route path="reports" element={<HostReportsPage />} />
              <Route path="reviews" element={<HostReviewsPage />} />
              <Route path="notifications" element={<HostNotificationsPage />} />
              <Route path="complaints" element={<HostComplaintsPage />} />
              <Route path="profile" element={<HostProfilePage />} />
              <Route path="settings" element={<HostSettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole="Admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="hosts" element={<AdminHostsPage />} />
              <Route path="properties" element={<AdminPropertiesPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="conversations" element={<AdminChatPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="complaints" element={<AdminComplaintsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
