import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, MapPin, Clock, CreditCard, BookOpen, Heart } from 'lucide-react'

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  isVerified: boolean
  status: 'active' | 'suspended'
  createdAt: string
  lastLoginAt: string
  totalBookings: number
  totalSpent: number
  wishlistCount: number
  bookingHistory: {
    id: string
    propertyName: string
    checkIn: string
    checkOut: string
    status: string
    amount: number
  }[]
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser({
            id: id || '1',
            name: 'Rahul Sharma',
            email: 'rahul@example.com',
            phone: '+91 9876543210',
            role: 'USER',
            isVerified: true,
            status: 'active',
            createdAt: '2024-01-15',
            lastLoginAt: '2024-03-20',
            totalBookings: 5,
            totalSpent: 45000,
            wishlistCount: 12,
            bookingHistory: [
              { id: 'BK001', propertyName: 'Grand Palace Hotel', checkIn: '2024-03-20', checkOut: '2024-03-25', status: 'completed', amount: 25000 },
              { id: 'BK002', propertyName: 'Beach Resort', checkIn: '2024-02-15', checkOut: '2024-02-18', status: 'completed', amount: 15000 },
              { id: 'BK003', propertyName: 'Mountain Homestay', checkIn: '2024-01-10', checkOut: '2024-01-12', status: 'completed', amount: 5000 },
            ]
          })
        }
      } catch (error) {
        setUser({
          id: id || '1',
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
          phone: '+91 9876543210',
          role: 'USER',
          isVerified: true,
          status: 'active',
          createdAt: '2024-01-15',
          lastLoginAt: '2024-03-20',
          totalBookings: 5,
          totalSpent: 45000,
          wishlistCount: 12,
          bookingHistory: [
            { id: 'BK001', propertyName: 'Grand Palace Hotel', checkIn: '2024-03-20', checkOut: '2024-03-25', status: 'completed', amount: 25000 },
          ]
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [id])

  const handleStatusChange = async (newStatus: 'active' | 'suspended') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (user) setUser({ ...user, status: newStatus })
    } catch (error) {
      console.error('Failed to update status')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return <div>User not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
          <p className="text-gray-600">View and manage user information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Verification</p>
                  <p className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user.isVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Booking History</h2>
            <div className="space-y-4">
              {user.bookingHistory.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.propertyName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{booking.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Total Bookings</span>
                </div>
                <span className="font-bold">{user.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Total Spent</span>
                </div>
                <span className="font-bold">₹{user.totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Wishlist Items</span>
                </div>
                <span className="font-bold">{user.wishlistCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <select
                value={user.status}
                onChange={(e) => handleStatusChange(e.target.value as 'active' | 'suspended')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <Link
                to={`/support?user=${user.id}`}
                className="block w-full px-4 py-2 text-center border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Create Support Ticket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
