import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, User, MapPin, Phone, Mail, CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react'

interface ServiceBooking {
  id: string
  bookingNumber: string
  userName: string
  userEmail: string
  userPhone: string
  serviceName: string
  serviceCategory: string
  serviceDate: string
  serviceTime: string
  location: string
  notes: string
  advanceAmount: number
  totalAmount: number
  remainingAmount: number
  status: 'ADVANCE_PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

export default function ServiceBookings() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ADVANCE_PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/service-bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings || [])
        } else {
          setBookings([
            { id: '1', bookingNumber: 'SB001', userName: 'Rahul Sharma', userEmail: 'rahul@example.com', userPhone: '+91 9876543210', serviceName: 'Airport Pickup', serviceCategory: 'transport', serviceDate: '2024-03-25', serviceTime: '10:00 AM', location: 'Mumbai Airport', notes: 'Flight arriving at 9:30 AM', advanceAmount: 1500, totalAmount: 1500, remainingAmount: 0, status: 'ADVANCE_PAID', createdAt: '2024-03-20' },
            { id: '2', bookingNumber: 'SB002', userName: 'Priya Patel', userEmail: 'priya@example.com', userPhone: '+91 9876543211', serviceName: 'Local Guide', serviceCategory: 'guide', serviceDate: '2024-03-26', serviceTime: '09:00 AM', location: 'Temple Complex', notes: 'Need guide for main temple', advanceAmount: 1000, totalAmount: 2000, remainingAmount: 1000, status: 'CONFIRMED', createdAt: '2024-03-21' },
            { id: '3', bookingNumber: 'SB003', userName: 'Amit Kumar', userEmail: 'amit@example.com', userPhone: '+91 9876543212', serviceName: 'Photography Session', serviceCategory: 'photography', serviceDate: '2024-03-22', serviceTime: '06:00 AM', location: 'Temple Gate', notes: 'Sunrise photography', advanceAmount: 1500, totalAmount: 3000, remainingAmount: 1500, status: 'COMPLETED', createdAt: '2024-03-18' },
            { id: '4', bookingNumber: 'SB004', userName: 'Sneha Gupta', userEmail: 'sneha@example.com', userPhone: '+91 9876543213', serviceName: 'Traditional Meal', serviceCategory: 'food', serviceDate: '2024-03-27', serviceTime: '12:30 PM', location: 'Heritage Kitchen', notes: 'Vegetarian meal for 2', advanceAmount: 500, totalAmount: 1000, remainingAmount: 500, status: 'CANCELLED', createdAt: '2024-03-19' },
          ])
        }
      } catch (error) {
        setBookings([
          { id: '1', bookingNumber: 'SB001', userName: 'Rahul Sharma', userEmail: 'rahul@example.com', userPhone: '+91 9876543210', serviceName: 'Airport Pickup', serviceCategory: 'transport', serviceDate: '2024-03-25', serviceTime: '10:00 AM', location: 'Mumbai Airport', notes: '', advanceAmount: 1500, totalAmount: 1500, remainingAmount: 0, status: 'ADVANCE_PAID', createdAt: '2024-03-20' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/service-bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus as typeof b.status } : b))
    } catch (error) {
      console.error('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADVANCE_PAID': return 'bg-yellow-100 text-yellow-700'
      case 'CONFIRMED': return 'bg-green-100 text-green-700'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Service Bookings</h1>
        <p className="text-gray-600 mt-1">Manage service bookings (transport, guide, photography)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'ADVANCE_PAID').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'CONFIRMED').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'COMPLETED').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'CANCELLED').length}</p>
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
              placeholder="Search bookings..."
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
            <option value="ADVANCE_PAID">Advance Paid</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">#{booking.bookingNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.serviceName}</p>
                      <p className="text-sm text-gray-500 capitalize">{booking.serviceCategory}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.userName}</p>
                      <p className="text-sm text-gray-500">{booking.userPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{new Date(booking.serviceDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{booking.serviceTime}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {booking.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                      {booking.remainingAmount > 0 && (
                        <p className="text-sm text-gray-500">Pending: ₹{booking.remainingAmount}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/service-bookings/${booking.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="ADVANCE_PAID">Advance Paid</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No bookings found
          </div>
        )}
      </div>
    </div>
  )
}
