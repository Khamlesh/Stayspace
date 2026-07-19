import apiClient from './client'

const chatAPI = {
  sendMessage: (data) => apiClient.post('/chat/send', data),
  getMessages: (data) => apiClient.post('/chat/messages', data),
  getList: (data) => apiClient.post('/chat/list', data),
  markRead: (data) => apiClient.post('/chat/mark-read', data),
  adminGetConversations: (data) => apiClient.post('/admin/chat', data),
}

export default chatAPI
