import api from './api'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  userId?: string
  userName?: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}

export interface NotificationsResponse {
  notifications?: NotificationItem[]
  data?: NotificationItem[]
  pagination?: {
    total: number
    page: number
    limit: number
  }
  unreadCount?: number
}

export const notificationsService = {
  getNotifications: async (params?: {
    page?: number
    limit?: number
    isRead?: boolean
  }) => {
    const response = await api.get('/v1/admin/notifications', { params })
    const payload = response.data as NotificationsResponse
    const notifications = payload.notifications ?? payload.data ?? []
    return {
      ...payload,
      notifications,
    }
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/v1/admin/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/v1/admin/notifications/read-all')
    return response.data
  },
}
