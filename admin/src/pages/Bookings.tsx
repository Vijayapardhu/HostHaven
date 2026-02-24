import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, User, Building2, CreditCard, RefreshCw, MoreVertical, Eye } from 'lucide-react'

interface Booking {
  id: string
  userName: string
  userEmail: string
  propertyName: string
  propertyType: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  paidAmount: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  paymentStatus: 'paid' | 'pending' | 'refunded'
  createdAt: string
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings || [])
        } else {
          setBookings([
            { id: '1', userName: 'Rahul Sharma', userEmail: 'rahul@example.com', propertyName: 'Grand Palace Hotel', propertyType: 'Hotel', checkIn: '2024-03-20', checkOut: '2024-03-25', guests: 2, totalAmount: 25000, paidAmount: 25000, status: 'confirmed', paymentStatus: 'paid', createdAt: '2024-03-15' },
            { id: '2', userName: 'Priya Patel', userEmail: 'priya@example.com', propertyName: 'Beach Resort', propertyType: 'Hotel', checkIn: '2024-03-22', checkOut: '2024-03-27', guests: 4, totalAmount: 40000, paidAmount: 10000, status: 'pending', paymentStatus: 'pending', createdAt: '2024-03-16' },
            { id: '3', userName: 'Amit Kumar', userEmail: 'amit@example.com', propertyName: 'Mountain Homestay', propertyType: 'Home', checkIn: '2024-03-18', checkOut: '2024-03-20', guests: 3, totalAmount: 7500, paidAmount: 7500, status: 'completed', paymentStatus: 'paid', createdAt: '2024-03-10' },
            { id: '4', userName: 'Sneha Gupta', userEmail: 'sneha@example.com', propertyName: 'Luxury Villa', propertyType: 'Villa', checkIn: '2024-03-25', checkOut: '2024-03-30', guests: 6, totalAmount: 75000, paidAmount: 75000, status: 'cancelled', paymentStatus: 'refunded', createdAt: '2024-03-12' },
          ])
        }
      } catch (error) {
        setBookings([
          { id: '1', userName: 'Rahul Sharma', userEmail: 'rahul@example.com', propertyName: 'Grand Palace Hotel', propertyType: 'Hotel', checkIn: '2024-03-20', checkOut: '2024-03-25', guests: 2, totalAmount: 25000, paidAmount: 25000, status: 'confirmed', paymentStatus: 'paid', createdAt: '2024-03-15' },
          { id: '2', userName: 'Priya Patel', userEmail: 'priya@example.com', propertyName: 'Beach Resort', propertyType: 'Hotel', checkIn: '2024-03-22', checkOut: '2024-03-27', guests: 4, totalAmount: 40000, paidAmount: 10000, status: 'pending', paymentStatus: 'pending', createdAt: '2024-03-16' },
          { id: '3', userName: 'Amit Kumar', userEmail: 'amit@example.com', propertyName: 'Mountain Homestay', propertyType: 'Home', checkIn: '2024-03-18', checkOut: '2024-03-20', guests: 3, totalAmount: 7500, paidAmount: 7500, status: 'completed', paymentStatus: 'paid', createdAt: '2024-03-10' },
          { id: '4', userName: 'Sneha Gupta', userEmail: 'sneha@example.com', propertyName: 'Luxury Villa', propertyType: 'Villa', checkIn: '2024-03-25', checkOut: '2024-03-30', guests: 6, totalAmount: 75000, paidAmount: 75000, status: 'cancelled', paymentStatus: 'refunded', createdAt: '2024-03-12' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(booking =>
    booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRefund = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings/${bookingId}/refund`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, paymentStatus: 'refunded', status: 'cancelled' } : b))
    } catch (error) {
      console.error('Failed to process refund')
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
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-1">Manage all bookings on the platform</p>
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
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">#{booking.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.userName}</p>
                      <p className="text-sm text-gray-500">{booking.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{booking.propertyName}</p>
                      <p className="text-sm text-gray-500">{booking.propertyType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                      <p className="text-gray-500">to {new Date(booking.checkOut).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                      <p className="text-sm text-green-600">Paid: ₹{booking.paidAmount.toLocaleString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : booking.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-700' 
                        : booking.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                      {booking.paymentStatus === 'paid' && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleRefund(booking.id)}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refund
                        </button>
                      )}
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
