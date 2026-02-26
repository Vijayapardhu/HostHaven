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

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.notifications ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    notifications: Array.isArray(data) ? data : [],
    pagination: meta
      ? {
          total: meta.total ?? 0,
          page: meta.page ?? 1,
          limit: meta.limit ?? 10,
        }
      : { total: 0, page: 1, limit: 10 },
    unreadCount: meta?.unreadCount ?? payload?.unreadCount ?? 0,
  }
}

export const notificationsService = {
  getNotifications: async (params?: {
    page?: number
    limit?: number
    isRead?: boolean
  }) => {
    const response = await api.get('/v1/admin/notifications', { params })
    return normalizeList(response.data)
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/v1/admin/notifications/${id}/read`)
    return response.data?.data ?? response.data
  },

  markAllAsRead: async () => {
    const response = await api.put('/v1/admin/notifications/read-all')
    return response.data?.data ?? response.data
  },
}
