import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['X-Auth-Token'] = token
    if (config.method !== 'get') {
      config.data = config.data || {}
      config.data.token = token
    }
  }
  return config
})

export const authAPI = {
  register: (name, email, password, role) =>
    apiClient.post('/auth/register', { name, email, password, role }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () =>
    apiClient.post('/auth/logout'),
  validate: (data = {}) =>
    apiClient.post('/auth/validate', data),
  checkEmail: (email) =>
    apiClient.post('/auth/check_email', { email }),
  changePassword: (email, oldPassword, newPassword) =>
    apiClient.post('/auth/change_password', { email, old_password: oldPassword, new_password: newPassword }),
  forgotPassword: ({ email, new_password }) =>
    apiClient.post('/auth/forgot_password', { email, new_password })
}

export const propertiesAPI = {
  create: (data) =>
    apiClient.post('/properties', data),
  list: (query = '', minPrice = 0, maxPrice = 0, guests = 0, propertyType = '') =>
    apiClient.get('/properties', { params: { query, min_price: minPrice, max_price: maxPrice, guests, property_type: propertyType } }),
  getDetails: (propertyId) =>
    apiClient.get(`/properties/${propertyId}`),
  getAvailability: (propertyId) =>
    apiClient.get(`/properties/${propertyId}/availability`),
}

export const bookingsAPI = {
  create: (data) =>
    apiClient.post('/bookings/create', data),
  getGuestBookings: () =>
    apiClient.post('/guest/bookings'),
  cancelBooking: (bookingId) =>
    apiClient.post('/guest/bookings/cancel', { booking_id: bookingId }),
}

export const adminAPI = {
  stats: () =>
    apiClient.post('/admin/stats'),
  guests: () =>
    apiClient.post('/admin/guests'),
  hosts: () =>
    apiClient.post('/admin/hosts'),
  properties: () =>
    apiClient.post('/admin/properties'),
  bookings: () =>
    apiClient.post('/admin/bookings')
}

export default apiClient
