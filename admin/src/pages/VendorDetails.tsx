import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Mail, Phone, MapPin, Star, FileText, CreditCard, Shield, CheckCircle, XCircle, Clock } from 'lucide-react'

interface VendorDetail {
  id: string
  name: string
  email: string
  phone: string
  propertyName: string
  propertyType: string
  location: string
  description: string
  rating: number
  totalBookings: number
  totalRevenue: number
  status: 'active' | 'pending' | 'suspended'
  kycStatus: 'verified' | 'pending' | 'rejected'
  kycDocuments: {
    type: string
    status: 'verified' | 'pending' | 'rejected'
    uploadedAt: string
  }[]
  bankDetails: {
    bankName: string
    accountNumber: string
    ifscCode: string
    accountType: 'savings' | 'current'
  }
  joinedAt: string
  recentBookings: {
    id: string
    userName: string
    checkIn: string
    checkOut: string
    amount: number
    status: string
  }[]
}

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setVendor(data.vendor)
        } else {
          setVendor({
            id: id || '1',
            name: 'John Doe',
            email: 'john@hotel.com',
            phone: '+91 9876543210',
            propertyName: 'Grand Hotel',
            propertyType: 'Hotel',
            location: 'Mumbai, MH',
            description: 'Luxury 5-star hotel in the heart of Mumbai',
            rating: 4.5,
            totalBookings: 120,
            totalRevenue: 600000,
            status: 'active',
            kycStatus: 'verified',
            kycDocuments: [
              { type: 'Aadhar Card', status: 'verified', uploadedAt: '2024-01-10' },
              { type: 'PAN Card', status: 'verified', uploadedAt: '2024-01-10' },
              { type: 'Property Deed', status: 'verified', uploadedAt: '2024-01-12' },
            ],
            bankDetails: {
              bankName: 'HDFC Bank',
              accountNumber: '****1234',
              ifscCode: 'HDFC0001234',
              accountType: 'savings'
            },
            joinedAt: '2024-01-10',
            recentBookings: [
              { id: 'BK001', userName: 'Rahul Sharma', checkIn: '2024-03-20', checkOut: '2024-03-25', amount: 25000, status: 'confirmed' },
              { id: 'BK002', userName: 'Priya Patel', checkIn: '2024-03-22', checkOut: '2024-03-27', amount: 40000, status: 'confirmed' },
            ]
          })
        }
      } catch (error) {
        setVendor({
          id: id || '1',
          name: 'John Doe',
          email: 'john@hotel.com',
          phone: '+91 9876543210',
          propertyName: 'Grand Hotel',
          propertyType: 'Hotel',
          location: 'Mumbai, MH',
          description: 'Luxury 5-star hotel',
          rating: 4.5,
          totalBookings: 120,
          totalRevenue: 600000,
          status: 'active',
          kycStatus: 'verified',
          kycDocuments: [
            { type: 'Aadhar Card', status: 'verified', uploadedAt: '2024-01-10' },
            { type: 'PAN Card', status: 'verified', uploadedAt: '2024-01-10' },
          ],
          bankDetails: {
            bankName: 'HDFC Bank',
            accountNumber: '****1234',
            ifscCode: 'HDFC0001234',
            accountType: 'savings'
          },
          joinedAt: '2024-01-10',
          recentBookings: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendor()
  }, [id])

  const handleStatusChange = async (newStatus: 'active' | 'suspended') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (vendor) setVendor({ ...vendor, status: newStatus })
    } catch (error) {
      console.error('Failed to update status')
    }
  }

  const handleKycVerification = async (docType: string, action: 'verify' | 'reject') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}/kyc`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentType: docType, action })
      })
      if (vendor) {
        setVendor({
          ...vendor,
          kycDocuments: vendor.kycDocuments.map(d => 
            d.type === docType ? { ...d, status: action === 'verify' ? 'verified' : 'rejected' } : d
          )
        })
      }
    } catch (error) {
      console.error('Failed to update KYC')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!vendor) return <div>Vendor not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vendors')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{vendor.propertyName}</h1>
          <p className="text-gray-600">Vendor Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Property Name</p>
                  <p className="font-medium">{vendor.propertyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{vendor.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">{vendor.rating} / 5</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">{new Date(vendor.joinedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1">{vendor.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">KYC Documents</h2>
            <div className="space-y-3">
              {vendor.kycDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{doc.type}</p>
                      <p className="text-sm text-gray-500">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'verified' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    ) : doc.status === 'rejected' ? (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" /> Rejected
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleKycVerification(doc.type, 'verify')}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleKycVerification(doc.type, 'reject')}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
            <div className="space-y-3">
              {vendor.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.userName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{booking.amount.toLocaleString()}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
              {vendor.recentBookings.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent bookings</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Vendor Info</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{vendor.name}</p>
                  <p className="text-sm text-gray-500">{vendor.propertyType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{vendor.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{vendor.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Bookings</span>
                <span className="font-bold">{vendor.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold text-green-600">₹{vendor.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <span className="font-bold">{vendor.rating}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Bank Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium">{vendor.bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium">{vendor.bankDetails.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IFSC Code</p>
                <p className="font-medium">{vendor.bankDetails.ifscCode}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <select
              value={vendor.status}
              onChange={(e) => handleStatusChange(e.target.value as 'active' | 'suspended')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspend</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
