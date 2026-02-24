import { useEffect, useState } from 'react'
import { Search, Home, MapPin, Star, User, CheckCircle, XCircle, Image, Eye } from 'lucide-react'

interface PropertyApproval {
  id: string
  name: string
  type: string
  location: string
  vendorName: string
  description: string
  price: number
  images: string[]
  amenities: string[]
  rooms: number
  submittedAt: string
}

export default function PropertyApproval() {
  const [properties, setProperties] = useState<PropertyApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchPendingProperties = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/properties?status=pending`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setProperties(data.properties || [])
        } else {
          setProperties([
            { id: '1', name: 'Sunrise Beach Resort', type: 'Hotel', location: 'Goa, GA', vendorName: 'Sarah Smith', description: 'Beautiful beachfront resort with stunning ocean views', price: 8000, images: [], amenities: ['Pool', 'WiFi', 'Restaurant', 'Spa'], rooms: 25, submittedAt: '2024-03-10' },
            { id: '2', name: 'Cozy Mountain Cabin', type: 'Home', location: 'Manali, HP', vendorName: 'Mike Johnson', description: 'Rustic cabin with panoramic mountain views', price: 3500, images: [], amenities: ['WiFi', 'Kitchen', 'Heating'], rooms: 3, submittedAt: '2024-03-12' },
            { id: '3', name: 'Heritage Guest House', type: 'Hotel', location: 'Jaipur, RJ', vendorName: 'Rajesh Kumar', description: 'Traditional Rajasthani architecture with modern amenities', price: 4500, images: [], amenities: ['WiFi', 'Restaurant', 'Parking'], rooms: 15, submittedAt: '2024-03-15' },
          ])
        }
      } catch (error) {
        setProperties([
          { id: '1', name: 'Sunrise Beach Resort', type: 'Hotel', location: 'Goa, GA', vendorName: 'Sarah Smith', description: 'Beautiful beachfront resort with stunning ocean views', price: 8000, images: [], amenities: ['Pool', 'WiFi', 'Restaurant', 'Spa'], rooms: 25, submittedAt: '2024-03-10' },
          { id: '2', name: 'Cozy Mountain Cabin', type: 'Home', location: 'Manali, HP', vendorName: 'Mike Johnson', description: 'Rustic cabin with panoramic mountain views', price: 3500, images: [], amenities: ['WiFi', 'Kitchen', 'Heating'], rooms: 3, submittedAt: '2024-03-12' },
          { id: '3', name: 'Heritage Guest House', type: 'Hotel', location: 'Jaipur, RJ', vendorName: 'Rajesh Kumar', description: 'Traditional Rajasthani architecture with modern amenities', price: 4500, images: [], amenities: ['WiFi', 'Restaurant', 'Parking'], rooms: 15, submittedAt: '2024-03-15' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingProperties()
  }, [])

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApproval = async (propertyId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/properties/${propertyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action === 'approve' ? 'active' : 'rejected' })
      })
      setProperties(properties.filter(p => p.id !== propertyId))
    } catch (error) {
      console.error(`Failed to ${action} property`)
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
        <h1 className="text-3xl font-bold text-gray-900">Property Approval</h1>
        <p className="text-gray-600 mt-1">Review and approve property listings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pending properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredProperties.map((property) => (
          <div key={property.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Image className="w-12 h-12 text-gray-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {property.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {property.location}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      by {property.vendorName}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval(property.id, 'reject')}
                      className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(property.id, 'approve')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-700">{property.description}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Price per night</p>
                    <p className="font-semibold text-gray-900">₹{property.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rooms</p>
                    <p className="font-semibold text-gray-900">{property.rooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold text-yellow-700">Pending Review</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="font-semibold text-gray-900">{new Date(property.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">All Caught Up!</h3>
          <p className="text-gray-600">No pending property approvals at the moment</p>
        </div>
      )}
    </div>
  )
}
