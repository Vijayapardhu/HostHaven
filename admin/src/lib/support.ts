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

const normalizeStatus = (status?: string): SupportTicket['status'] => {
  if (!status) return 'open'
  const value = status.toLowerCase()
  if (value === 'in_progress') return 'in_progress'
  if (value === 'resolved') return 'resolved'
  if (value === 'closed') return 'closed'
  return 'open'
}

const mapTicket = (ticket: any): SupportTicket => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber ?? ticket.id,
  userId: ticket.user?.id ?? ticket.userId,
  vendorId: ticket.vendorId,
  userName: ticket.user?.name ?? ticket.userName,
  email: ticket.user?.email ?? ticket.email ?? '',
  category: ticket.category ?? 'general',
  subject: ticket.bookingReference ?? ticket.subject ?? ticket.category ?? 'Support request',
  description: ticket.message ?? ticket.description ?? '',
  attachments: ticket.attachmentUrl ? [ticket.attachmentUrl] : ticket.attachments,
  status: normalizeStatus(ticket.status),
  priority: ticket.priority ?? 'medium',
  notes: ticket.adminNotes
    ? [
        {
          id: 'admin-note',
          content: ticket.adminNotes,
          addedBy: 'Admin',
          createdAt: ticket.updatedAt ?? ticket.createdAt,
        },
      ]
    : ticket.notes,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt ?? ticket.createdAt,
  resolvedAt: ticket.resolvedAt,
})

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.tickets ?? []
  const meta = payload?.meta ?? payload?.pagination
  return {
    data: Array.isArray(data) ? data.map(mapTicket) : [],
    pagination: meta
      ? {
          total: meta.total ?? 0,
          page: meta.page ?? 1,
          limit: meta.limit ?? 10,
          totalPages: meta.totalPages ?? meta.pages ?? 1,
        }
      : { total: 0, page: 1, limit: 10, totalPages: 1 },
  }
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
    const response = await api.get('/v1/support/tickets/admin', {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status?.toUpperCase(),
      },
    })
    const normalized = normalizeList(response.data)
    let filtered = normalized.data
    if (params?.search) {
      const query = params.search.toLowerCase()
      filtered = filtered.filter((ticket) => {
        const haystack = [ticket.ticketNumber, ticket.subject, ticket.email, ticket.userName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    }
    if (params?.priority) {
      filtered = filtered.filter((ticket) => ticket.priority === params.priority)
    }
    if (params?.category) {
      filtered = filtered.filter((ticket) => ticket.category === params.category)
    }
    return { ...normalized, data: filtered }
  },

  getTicketById: async (id: string) => {
    const response = await api.get(`/v1/support/tickets/admin`, { params: { page: 1, limit: 100 } })
    const normalized = normalizeList(response.data)
    return normalized.data.find((item: SupportTicket) => item.id === id)
  },

  updateTicketStatus: async (
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    const nextStatus = status === 'closed' ? 'RESOLVED' : status.toUpperCase()
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}`, {
      status: nextStatus,
    })
    return response.data?.data ?? response.data
  },

  updateTicketPriority: async (ticketId: string, priority: 'low' | 'medium' | 'high') => {
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}`, {
      priority: priority.toUpperCase(),
    })
    return response.data?.data ?? response.data
  },

  addNote: async (ticketId: string, data: CreateTicketNoteRequest) => {
    const response = await api.post(`/v1/support/tickets/admin/${ticketId}/notes`, {
      content: data.content,
    })
    return response.data?.data ?? response.data
  },

  closeTicket: async (ticketId: string) => {
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}`, {
      status: 'RESOLVED',
    })
    return response.data?.data ?? response.data
  },

  reopenTicket: async (ticketId: string) => {
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}`, {
      status: 'OPEN',
    })
    return response.data?.data ?? response.data
  },

  getCategories: async () => {
    return [
      { label: 'Booking Issue', value: 'booking' },
      { label: 'Payment Issue', value: 'payment' },
      { label: 'Property Complaint', value: 'property' },
      { label: 'Account Issue', value: 'account' },
      { label: 'Refund Request', value: 'refund' },
      { label: 'General Inquiry', value: 'general' },
      { label: 'Other', value: 'other' },
    ]
  },

  exportTickets: async (params?: Record<string, any>) => {
    const response = await api.get('/v1/admin/export/support', {
      responseType: 'blob',
      params,
    })
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `support_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
