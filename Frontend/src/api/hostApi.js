import apiClient from './client'

const hostAPI = {
  getDashboardKPI: () =>
    apiClient.post('/host/stats'),

  getRecentBookings: () =>
    apiClient.post('/host/bookings'),

  getUpcomingCheckins: () =>
    apiClient.post('/host/checkins'),

  getMyProperties: () =>
    apiClient.post('/host/properties'),

  getPropertyDetail: (propertyId) =>
    apiClient.get(`/host/property/${propertyId}`),

  createProperty: (data) =>
    apiClient.post('/host/property/create', data),

  updateProperty: (data) =>
    apiClient.post('/host/property/update', data),

  deleteProperty: (propertyId) =>
    apiClient.post('/host/property/delete', { property_id: propertyId }),

  getRecentReviews: () =>
    apiClient.post('/host/reviews'),

  getMonthlyEarnings: () =>
    apiClient.post('/host/earnings-chart'),

  getEarnings: () =>
    apiClient.post('/host/earnings'),

  getNotifications: () =>
    apiClient.get('/host/notifications'),

  markNotificationsRead: (notificationId) =>
    apiClient.post('/host/notifications/read', { notification_id: notificationId }),

  deleteNotification: (notificationId) =>
    apiClient.post('/host/notifications/delete', { notification_id: notificationId }),

  getProfile: () =>
    apiClient.get('/host/profile'),

  updateProfile: (data) =>
    apiClient.post('/host/profile', data),

  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/host/change_password', { old_password: oldPassword, new_password: newPassword }),

  bookingAction: (bookingId, action) =>
    apiClient.post('/host/booking/action', { booking_id: bookingId, action }),

  getReports: () =>
    apiClient.post('/host/reports'),

  getComplaints: () =>
    apiClient.post('/host/complaints'),

  createComplaint: (data) =>
    apiClient.post('/host/complaint/create', data),

  blockDates: (propertyId, startDate, endDate, reason) =>
    apiClient.post('/host/property/block-dates', { property_id: propertyId, start_date: startDate, end_date: endDate, reason }),

  unblockDates: (blockId) =>
    apiClient.post('/host/property/unblock-dates', { block_id: blockId }),

  unblockAllForProperty: (propertyId) =>
    apiClient.post('/host/property/unblock-dates', { property_id: propertyId }),
}

export default hostAPI
