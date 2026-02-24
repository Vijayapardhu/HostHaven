import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, CreditCard, CheckCircle, XCircle, MessageSquare, Save, Users } from 'lucide-react'

interface WorkerAssignment {
  name: string
  phone: string
  role: string
  notes: string
}

interface ServiceBookingDetail {
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
  adminContactedAt?: string
  assignedWorker?: WorkerAssignment
  activityLog: { action: string; timestamp: string; by: string }[]
}

export default function ServiceBookingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<ServiceBookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [worker, setWorker] = useState<WorkerAssignment>({
    name: '',
    phone: '',
    role: 'Guide',
    notes: '',
  })

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/service-bookings/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setBooking(data.booking)
          if (data.booking?.assignedWorker) {
            setWorker(data.booking.assignedWorker)
          }
        } else {
          const mockBooking: ServiceBookingDetail = {
            id: id || '1',
            bookingNumber: 'SB001',
            userName: 'Rahul Sharma',
            userEmail: 'rahul@example.com',
            userPhone: '+91 9876543210',
            serviceName: 'Local Guide',
            serviceCategory: 'guide',
            serviceDate: '2024-03-25',
            serviceTime: '09:00 AM',
            location: 'Temple Complex, Tirupati',
            notes: 'Need guide for main temple and nearby spots',
            advanceAmount: 1000,
            totalAmount: 2000,
            remainingAmount: 1000,
            status: 'ADVANCE_PAID',
            createdAt: '2024-03-20',
            activityLog: [
              { action: 'Service booking created', timestamp: '2024-03-20T10:00:00Z', by: 'System' },
              { action: 'Advance payment received', timestamp: '2024-03-20T10:05:00Z', by: 'System' },
            ]
          }
          setBooking(mockBooking)
        }
      } catch (error) {
        setBooking(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  const handleAssignWorker = async () => {
    if (!booking) return
    setIsSaving(true)
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/service-bookings/${id}/assign-worker`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(worker)
      })
      setBooking({
        ...booking,
        assignedWorker: worker,
        status: booking.status === 'ADVANCE_PAID' ? 'CONFIRMED' : booking.status
      })
    } catch (error) {
      console.error('Failed to assign worker')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: ServiceBookingDetail['status']) => {
    if (!booking) return
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/service-bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      setBooking({ ...booking, status: newStatus })
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

  if (!booking) return <div>Service booking not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/service-bookings')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Booking #{booking.bookingNumber}</h1>
          <p className="text-gray-600">Advance paid, assign worker and confirm</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{booking.serviceName}</p>
                  <p className="text-sm text-gray-500 capitalize">{booking.serviceCategory}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(booking.serviceDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{booking.serviceTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{booking.location}</p>
                </div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Notes:</strong> {booking.notes}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Advance Paid</span>
                <span className="font-semibold text-green-600">₹{booking.advanceAmount.toLocaleString()}</span>
              </div>
              {booking.remainingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-semibold text-yellow-600">₹{booking.remainingAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Assignment</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                <input
                  type="text"
                  value={worker.name}
                  onChange={(e) => setWorker({ ...worker, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={worker.phone}
                    onChange={(e) => setWorker({ ...worker, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={worker.role}
                    onChange={(e) => setWorker({ ...worker, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Guide">Guide</option>
                    <option value="Driver">Driver</option>
                    <option value="Photographer">Photographer</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={worker.notes}
                  onChange={(e) => setWorker({ ...worker, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={handleAssignWorker}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Assign Worker
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span>{booking.userName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{booking.userEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{booking.userPhone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-3">
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(e.target.value as ServiceBookingDetail['status'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ADVANCE_PAID">Advance Paid</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <p className="text-sm text-gray-500">
                Admin receives request after advance payment and assigns worker.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
