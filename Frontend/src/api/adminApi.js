import apiClient from './client'

const adminAPI = {
  getStats: () =>
    apiClient.post('/admin/stats'),

  getUsers: () =>
    apiClient.post('/admin/users'),

  deleteUser: (userId) =>
    apiClient.post('/admin/user/delete', { user_id: userId }),

  getHosts: () =>
    apiClient.post('/admin/hosts'),

  approveHost: (hostId) =>
    apiClient.post('/admin/host/approve', { host_id: hostId }),

  rejectHost: (hostId) =>
    apiClient.post('/admin/host/reject', { host_id: hostId }),

  getProperties: () =>
    apiClient.post('/admin/properties'),

  deleteProperty: (propertyId) =>
    apiClient.post('/admin/property/delete', { property_id: propertyId }),

  getBookings: () =>
    apiClient.post('/admin/bookings'),

  bookingAction: (bookingId, action) =>
    apiClient.post('/admin/booking/action', { booking_id: bookingId, action }),

  getPayments: () =>
    apiClient.post('/admin/payments'),

  getReviews: () =>
    apiClient.post('/admin/reviews'),

  deleteReview: (reviewId) =>
    apiClient.post('/admin/review/delete', { review_id: reviewId }),

  getComplaints: () =>
    apiClient.post('/admin/complaints'),

  updateComplaint: (data) =>
    apiClient.post('/admin/complaint/update', data),

  getNotifications: (params = {}) => {
    const query = new URLSearchParams()
    if (params.page) query.set('page', params.page)
    if (params.limit) query.set('limit', params.limit)
    if (params.type) query.set('type', params.type)
    if (params.search) query.set('search', params.search)
    if (params.sort) query.set('sort', params.sort)
    if (params.read) query.set('read', params.read)
    const qs = query.toString()
    return apiClient.get(`/admin/notifications${qs ? '?' + qs : ''}`)
  },

  markNotificationsRead: (notificationId) =>
    apiClient.post('/admin/notifications/read', { notification_id: notificationId }),

  deleteNotification: (notificationId) =>
    apiClient.post('/admin/notifications/delete', { notification_id: notificationId }),

  getUnreadCount: () =>
    apiClient.get('/admin/notifications/unread-count'),

  getProfile: () =>
    apiClient.get('/admin/profile'),

  updateProfile: (data) =>
    apiClient.post('/admin/profile', data),

  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/admin/change_password', { old_password: oldPassword, new_password: newPassword }),

  getAnalytics: () =>
    apiClient.post('/admin/analytics'),

  getReports: () =>
    apiClient.post('/admin/reports'),
}

export default adminAPI
