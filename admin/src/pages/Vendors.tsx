import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Building2, MapPin, Phone, Mail, Star, ArrowRight, CheckCircle, XCircle } from 'lucide-react'

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  propertyName: string
  location: string
  rating: number
  totalBookings: number
  status: 'active' | 'pending' | 'suspended'
  kycVerified: boolean
  createdAt: string
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/vendors`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setVendors(data.vendors || [])
        } else {
          setVendors([
            { id: '1', name: 'John Doe', email: 'john@hotel.com', phone: '+91 9876543210', propertyName: 'Grand Hotel', location: 'Mumbai, MH', rating: 4.5, totalBookings: 120, status: 'active', kycVerified: true, createdAt: '2024-01-10' },
            { id: '2', name: 'Sarah Smith', email: 'sarah@resort.com', phone: '+91 9876543211', propertyName: 'Beach Resort', location: 'Goa, GA', rating: 4.8, totalBookings: 85, status: 'active', kycVerified: true, createdAt: '2024-02-15' },
            { id: '3', name: 'Mike Johnson', email: 'mike@homestay.com', phone: '+91 9876543212', propertyName: 'Mountain Homestay', location: 'Manali, HP', rating: 4.2, totalBookings: 45, status: 'pending', kycVerified: false, createdAt: '2024-03-01' },
          ])
        }
      } catch (error) {
        setVendors([
          { id: '1', name: 'John Doe', email: 'john@hotel.com', phone: '+91 9876543210', propertyName: 'Grand Hotel', location: 'Mumbai, MH', rating: 4.5, totalBookings: 120, status: 'active', kycVerified: true, createdAt: '2024-01-10' },
          { id: '2', name: 'Sarah Smith', email: 'sarah@resort.com', phone: '+91 9876543211', propertyName: 'Beach Resort', location: 'Goa, GA', rating: 4.8, totalBookings: 85, status: 'active', kycVerified: true, createdAt: '2024-02-15' },
          { id: '3', name: 'Mike Johnson', email: 'mike@homestay.com', phone: '+91 9876543212', propertyName: 'Mountain Homestay', location: 'Manali, HP', rating: 4.2, totalBookings: 45, status: 'pending', kycVerified: false, createdAt: '2024-03-01' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendors()
  }, [])

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage registered vendors</p>
        </div>
        <Link
          to="/vendors/approval"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Pending Approvals
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
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
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{vendor.propertyName}</p>
                    <p className="text-sm text-gray-500">{vendor.totalBookings} bookings</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {vendor.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{vendor.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vendor.kycVerified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vendor.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : vendor.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVendors.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No vendors found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}
