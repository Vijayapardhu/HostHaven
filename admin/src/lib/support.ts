import api from './api'

export interface SupportTicket {
  id: string
  ticketNumber: string
  userId?: string
  vendorId?: string
  userName?: string
  email: string
  category: string
  subject: string
  description: string
  attachments?: string[]
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  notes?: Array<{
    id: string
    content: string
    addedBy: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface CreateTicketNoteRequest {
  content: string
}

export const supportService = {
  getTickets: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    priority?: string
    category?: string
  }) => {
    const response = await api.get('/v1/admin/support/tickets', { params })
    return response.data
  },

  getTicketById: async (id: string) => {
    const response = await api.get<SupportTicket>(`/v1/admin/support/tickets/${id}`)
    return response.data
  },

  updateTicketStatus: async (
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    const response = await api.patch(`/v1/admin/support/tickets/${ticketId}`, { status })
    return response.data
  },

  updateTicketPriority: async (ticketId: string, priority: 'low' | 'medium' | 'high') => {
    const response = await api.patch(`/v1/admin/support/tickets/${ticketId}`, { priority })
    return response.data
  },

  addNote: async (ticketId: string, data: CreateTicketNoteRequest) => {
    const response = await api.post(`/v1/admin/support/tickets/${ticketId}/notes`, data)
    return response.data
  },

  closeTicket: async (ticketId: string) => {
    const response = await api.patch(`/v1/admin/support/tickets/${ticketId}/close`)
    return response.data
  },

  getCategories: async () => {
    const response = await api.get<string[]>('/v1/admin/support/categories')
    return response.data
  },

  exportTickets: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/support/tickets/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
