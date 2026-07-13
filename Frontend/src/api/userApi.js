import apiClient from './client'

const userAPI = {
  getDashboardStats: () =>
    apiClient.post('/guest/stats'),

  getProfile: () =>
    apiClient.get('/guest/profile'),

  updateProfile: (data) =>
    apiClient.post('/guest/profile', data),

  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/guest/change_password', { old_password: oldPassword, new_password: newPassword }),

  getNotifications: () =>
    apiClient.get('/guest/notifications'),

  markNotificationsRead: (notificationId) =>
    apiClient.post('/guest/notifications/read', { notification_id: notificationId }),

  deleteNotification: (notificationId) =>
    apiClient.post('/guest/notifications/delete', { notification_id: notificationId }),

  getWishlist: () =>
    apiClient.post('/guest/wishlist'),

  addToWishlist: (propertyId) =>
    apiClient.post('/guest/wishlist/add', { property_id: propertyId }),

  removeFromWishlist: (propertyId) =>
    apiClient.post('/guest/wishlist/remove', { property_id: propertyId }),

  checkWishlist: (propertyId) =>
    apiClient.post('/guest/wishlist/check', { property_id: propertyId }),

  getReviews: () =>
    apiClient.post('/guest/reviews'),

  createReview: (data) =>
    apiClient.post('/guest/reviews/create', data),

  deleteReview: (reviewId) =>
    apiClient.post('/guest/reviews/delete', { review_id: reviewId }),

  getPayments: () =>
    apiClient.post('/guest/payments'),

  getComplaints: () =>
    apiClient.post('/guest/complaints'),

  createComplaint: (data) =>
    apiClient.post('/guest/complaint/create', data),
}

export default userAPI
