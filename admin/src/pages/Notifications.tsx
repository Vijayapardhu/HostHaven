import { useEffect, useState } from 'react'
import { Search, Bell, CheckCircle, Clock, Trash2, Mail, MessageSquare, Calendar, CreditCard, Home, User } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  userId: string
  userName: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
        } else {
          setNotifications([
            { id: '1', type: 'booking_confirmed', title: 'New Booking', message: 'A new booking has been made at Grand Palace Hotel', userId: 'U1', userName: 'Rahul Sharma', isRead: false, createdAt: '2024-03-20T10:00:00Z' },
            { id: '2', type: 'payment_received', title: 'Payment Received', message: 'Payment of ₹25,000 received for booking BK001', userId: 'U1', userName: 'Rahul Sharma', isRead: false, createdAt: '2024-03-20T09:30:00Z' },
            { id: '3', type: 'vendor_registered', title: 'New Vendor', message: 'A new vendor has registered and is pending approval', userId: 'U2', userName: 'John Doe', isRead: true, createdAt: '2024-03-19T15:00:00Z' },
            { id: '4', type: 'review_submitted', title: 'New Review', message: 'A new review has been submitted for Beach Resort', userId: 'U3', userName: 'Priya Patel', isRead: true, createdAt: '2024-03-19T12:00:00Z' },
            { id: '5', type: 'support_ticket', title: 'Support Ticket', message: 'A new support ticket has been created', userId: 'U4', userName: 'Amit Kumar', isRead: false, createdAt: '2024-03-18T18:00:00Z' },
            { id: '6', type: 'property_approved', title: 'Property Approved', message: 'Mountain View Resort has been approved and is now live', userId: 'U5', userName: 'Sarah Smith', isRead: true, createdAt: '2024-03-18T10:00:00Z' },
          ])
        }
      } catch (error) {
        setNotifications([
          { id: '1', type: 'booking_confirmed', title: 'New Booking', message: 'A new booking has been made', userId: 'U1', userName: 'Rahul Sharma', isRead: false, createdAt: '2024-03-20T10:00:00Z' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.userName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'unread' ? !notification.isRead : notification.isRead)
    return matchesSearch && matchesFilter
  })

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n))
    } catch (error) {
      console.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Failed to delete notification')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
        return <Calendar className="w-5 h-5" />
      case 'payment_received':
      case 'payment_failed':
        return <CreditCard className="w-5 h-5" />
      case 'vendor_registered':
      case 'vendor_approved':
        return <User className="w-5 h-5" />
      case 'review_submitted':
        return <MessageSquare className="w-5 h-5" />
      case 'support_ticket':
        return <Mail className="w-5 h-5" />
      case 'property_approved':
        return <Home className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'vendor_approved':
      case 'property_approved':
        return 'bg-green-100 text-green-600'
      case 'booking_cancelled':
      case 'payment_failed':
        return 'bg-red-100 text-red-600'
      case 'payment_received':
        return 'bg-blue-100 text-blue-600'
      case 'review_submitted':
        return 'bg-yellow-100 text-yellow-600'
      case 'support_ticket':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">View and manage platform notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Read</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.isRead).length}</p>
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
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${getIconColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">by {notification.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No notifications found
          </div>
        )}
      </div>
    </div>
  )
}
