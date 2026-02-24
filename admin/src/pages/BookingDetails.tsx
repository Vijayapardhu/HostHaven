import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Home, Calendar, CreditCard, Clock, CheckCircle, XCircle, RefreshCw, MessageSquare, FileText, MapPin, Mail, Phone } from 'lucide-react'

interface BookingDetail {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  propertyId: string
  propertyName: string
  propertyType: string
  propertyAddress: string
  roomName: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  paymentStatus: 'paid' | 'pending' | 'partially_paid' | 'refunded'
  createdAt: string
  paymentMethod?: string
  transactionId?: string
  specialRequests?: string
  bookingHistory: {
    action: string
    timestamp: string
    performedBy: string
  }[]
}

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setBooking(data.booking)
        } else {
          setBooking({
            id: id || '1',
            userId: 'U1',
            userName: 'Rahul Sharma',
            userEmail: 'rahul@example.com',
            userPhone: '+91 9876543210',
            propertyId: 'P1',
            propertyName: 'Grand Palace Hotel',
            propertyType: 'Hotel',
            propertyAddress: '123 Marine Drive, Mumbai',
            roomName: 'Deluxe Suite',
            checkIn: '2024-03-20',
            checkOut: '2024-03-25',
            guests: 2,
            totalAmount: 25000,
            paidAmount: 25000,
            pendingAmount: 0,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: '2024-03-15',
            paymentMethod: 'Razorpay',
            transactionId: 'TXN123456',
            specialRequests: 'Early check-in requested',
            bookingHistory: [
              { action: 'Booking created', timestamp: '2024-03-15T10:00:00Z', performedBy: 'User' },
              { action: 'Payment verified', timestamp: '2024-03-15T10:05:00Z', performedBy: 'System' },
              { action: 'Booking confirmed', timestamp: '2024-03-15T10:06:00Z', performedBy: 'System' },
            ]
          })
        }
      } catch (error) {
        setBooking({
          id: id || '1',
          userId: 'U1',
          userName: 'Rahul Sharma',
          userEmail: 'rahul@example.com',
          userPhone: '+91 9876543210',
          propertyId: 'P1',
          propertyName: 'Grand Palace Hotel',
          propertyType: 'Hotel',
          propertyAddress: '123 Marine Drive, Mumbai',
          roomName: 'Deluxe Suite',
          checkIn: '2024-03-20',
          checkOut: '2024-03-25',
          guests: 2,
          totalAmount: 25000,
          paidAmount: 25000,
          pendingAmount: 0,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: '2024-03-15',
          bookingHistory: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to refund this booking?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings/${id}/refund`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (booking) setBooking({ ...booking, paymentStatus: 'refunded', status: 'cancelled' })
    } catch (error) {
      console.error('Failed to process refund')
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (booking) setBooking({ ...booking, status: 'cancelled' })
    } catch (error) {
      console.error('Failed to cancel booking')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!booking) return <div>Booking not found</div>

  const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bookings')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking #{booking.id}</h1>
            <p className="text-gray-600">Created on {new Date(booking.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {booking.paymentStatus === 'paid' && booking.status !== 'cancelled' && (
            <button onClick={handleRefund} className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Refund
            </button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Property</p>
                  <p className="font-medium">{booking.propertyName}</p>
                  <p className="text-sm text-gray-500">{booking.propertyType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Check-in / Check-out</p>
                  <p className="font-medium">
                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">{nights} nights, {booking.guests} guests</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Room</p>
                  <p className="font-medium">{booking.roomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{booking.propertyAddress}</p>
                </div>
              </div>
            </div>
            {booking.specialRequests && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Special Requests:</strong> {booking.specialRequests}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Paid Amount</span>
                <span className="font-bold text-green-600">₹{booking.paidAmount.toLocaleString()}</span>
              </div>
              {booking.pendingAmount > 0 && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Pending Amount</span>
                  <span className="font-bold text-yellow-600">₹{booking.pendingAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-gray-600">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                  booking.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-700' :
                  booking.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {booking.paymentStatus.replace('_', ' ')}
                </span>
              </div>
              {booking.paymentMethod && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Payment Method: {booking.paymentMethod}</p>
                  {booking.transactionId && (
                    <p className="text-sm text-gray-500">Transaction ID: {booking.transactionId}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Booking History</h2>
            <div className="space-y-4">
              {booking.bookingHistory.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">{event.action}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()} • {event.performedBy}
                    </p>
                  </div>
                </div>
              ))}
              {booking.bookingHistory.length === 0 && (
                <p className="text-gray-500">No booking history</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Guest Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{booking.userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{booking.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{booking.userPhone}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/users/${booking.userId}`)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              View User Profile
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Booking Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                  booking.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.paymentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Contact Guest
              </button>
              <button
                onClick={() => navigate(`/properties/${booking.propertyId}`)}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                View Property
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
