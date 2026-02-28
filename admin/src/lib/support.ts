import api from './api'

export interface SupportTicket {
  id: string
  ticketNumber: string
  userId?: string
  vendorId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  email: string
  category: string
  subject: string
  description: string
  attachments?: string[]
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  adminNotes?: string
  parsedNotes?: ParsedNote[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface ParsedNote {
  timestamp: string
  author: string
  content: string
}

const normalizeStatus = (status?: string): SupportTicket['status'] => {
  if (!status) return 'open'
  const v = status.toLowerCase()
  if (v === 'in_progress') return 'in_progress'
  if (v === 'resolved') return 'resolved'
  if (v === 'closed') return 'closed'
  return 'open'
}

const parseAdminNotes = (raw?: string | null): ParsedNote[] => {
  if (!raw) return []
  return raw.split('\n---\n').map(entry => {
    const match = entry.match(/^\[([^\]]+)\]\s*(?:\(([^)]+)\)\s*)?(.*)$/s)
    if (match) {
      return { timestamp: match[1], author: match[2] || 'Admin', content: match[3].trim() }
    }
    return { timestamp: '', author: 'Admin', content: entry.trim() }
  }).filter(n => n.content)
}

const mapTicket = (ticket: any): SupportTicket => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber ?? ticket.id,
  userId: ticket.user?.id ?? ticket.userId,
  userName: ticket.user?.name ?? ticket.userName,
  userEmail: ticket.user?.email,
  userPhone: ticket.user?.phone,
  email: ticket.user?.email ?? ticket.email ?? '',
  category: ticket.category ?? 'general',
  subject: ticket.bookingReference ?? ticket.subject ?? ticket.category ?? 'Support request',
  description: ticket.message ?? ticket.description ?? '',
  attachments: ticket.attachmentUrl ? [ticket.attachmentUrl] : ticket.attachments,
  status: normalizeStatus(ticket.status),
  priority: ticket.priority ?? 'medium',
  adminNotes: ticket.adminNotes,
  parsedNotes: parseAdminNotes(ticket.adminNotes),
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
      ? { total: meta.total ?? 0, page: meta.page ?? 1, limit: meta.limit ?? 10, totalPages: meta.totalPages ?? meta.pages ?? 1 }
      : { total: 0, page: 1, limit: 10, totalPages: 1 },
  }
}

export const supportService = {
  getTickets: async (params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string }) => {
    const response = await api.get('/v1/support/tickets/admin', {
      params: { page: params?.page, limit: params?.limit, status: params?.status?.toUpperCase() },
    })
    const normalized = normalizeList(response.data)
    let filtered = normalized.data
    if (params?.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter(t => [t.ticketNumber, t.subject, t.email, t.userName].filter(Boolean).join(' ').toLowerCase().includes(q))
    }
    if (params?.priority) filtered = filtered.filter(t => t.priority === params.priority)
    return { ...normalized, data: filtered }
  },

  getTicketById: async (id: string): Promise<SupportTicket> => {
    const response = await api.get(`/v1/support/tickets/admin/${id}`)
    const raw = response.data?.data ?? response.data
    return mapTicket(raw)
  },

  updateTicketStatus: async (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    const backendStatus = status === 'closed' ? 'RESOLVED' : status.toUpperCase()
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}`, { status: backendStatus })
    return response.data?.data ?? response.data
  },

  addNote: async (ticketId: string, content: string) => {
    const response = await api.post(`/v1/support/tickets/admin/${ticketId}/notes`, { content })
    return mapTicket(response.data?.data ?? response.data)
  },

  reopenTicket: async (ticketId: string) => {
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}/reopen`)
    return response.data?.data ?? response.data
  },

  closeTicket: async (ticketId: string) => {
    const response = await api.put(`/v1/support/tickets/admin/${ticketId}`, { status: 'RESOLVED' })
    return response.data?.data ?? response.data
  },
}
