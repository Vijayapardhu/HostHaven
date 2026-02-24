import { useEffect, useState } from 'react'
import { Search, User, MessageSquare, Phone, Mail, Clock, CheckCircle, AlertCircle, MoreVertical } from 'lucide-react'

interface Ticket {
  id: string
  userName: string
  userEmail: string
  category: string
  subject: string
  message: string
  bookingReference?: string
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/support/tickets`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setTickets(data.tickets || [])
        } else {
          setTickets([
            { id: 'TKT001', userName: 'Rahul Sharma', userEmail: 'rahul@example.com', category: 'Booking Issue', subject: 'Unable to modify booking', message: 'I tried to modify my booking but the website is not allowing me to do so.', bookingReference: 'BK001', status: 'open', priority: 'high', createdAt: '2024-03-18' },
            { id: 'TKT002', userName: 'Priya Patel', userEmail: 'priya@example.com', category: 'Payment', subject: 'Payment failed but amount deducted', message: 'My payment failed but the amount was deducted from my account.', bookingReference: 'BK002', status: 'in_progress', priority: 'high', createdAt: '2024-03-17' },
            { id: 'TKT003', userName: 'Amit Kumar', userEmail: 'amit@example.com', category: 'General Inquiry', subject: 'Question about cancellation policy', message: 'What is the cancellation policy for hotels?', status: 'resolved', priority: 'low', createdAt: '2024-03-15' },
            { id: 'TKT004', userName: 'Sneha Gupta', userEmail: 'sneha@example.com', category: 'Property Issue', subject: 'Property not as described', message: 'The property was not as shown in the pictures. Very disappointed.', bookingReference: 'BK004', status: 'open', priority: 'medium', createdAt: '2024-03-16' },
          ])
        }
      } catch (error) {
        setTickets([
          { id: 'TKT001', userName: 'Rahul Sharma', userEmail: 'rahul@example.com', category: 'Booking Issue', subject: 'Unable to modify booking', message: 'I tried to modify my booking but the website is not allowing me to do so.', bookingReference: 'BK001', status: 'open', priority: 'high', createdAt: '2024-03-18' },
          { id: 'TKT002', userName: 'Priya Patel', userEmail: 'priya@example.com', category: 'Payment', subject: 'Payment failed but amount deducted', message: 'My payment failed but the amount was deducted from my account.', bookingReference: 'BK002', status: 'in_progress', priority: 'high', createdAt: '2024-03-17' },
          { id: 'TKT003', userName: 'Amit Kumar', userEmail: 'amit@example.com', category: 'General Inquiry', subject: 'Question about cancellation policy', message: 'What is the cancellation policy for hotels?', status: 'resolved', priority: 'low', createdAt: '2024-03-15' },
          { id: 'TKT004', userName: 'Sneha Gupta', userEmail: 'sneha@example.com', category: 'Property Issue', subject: 'Property not as described', message: 'The property was not as shown in the pictures. Very disappointed.', bookingReference: 'BK004', status: 'open', priority: 'medium', createdAt: '2024-03-16' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
    } catch (error) {
      console.error('Failed to update ticket status')
    }
  }

  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600 mt-1">Manage customer support tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-500">#{ticket.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : ticket.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'open'
                        ? 'bg-red-100 text-red-700'
                        : ticket.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-2">{ticket.subject}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {ticket.userName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {ticket.userEmail}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>{ticket.category}</span>
                  </div>
                  <p className="mt-3 text-gray-700">{ticket.message}</p>
                  {ticket.bookingReference && (
                    <p className="mt-2 text-sm text-gray-500">
                      Booking Reference: <span className="font-mono">{ticket.bookingReference}</span>
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value as typeof ticket.status)}
                    className="text-sm border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No tickets found
          </div>
        )}
      </div>
    </div>
  )
}
