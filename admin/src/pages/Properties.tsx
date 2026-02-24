import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Home, MapPin, Star, User, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'

interface Property {
  id: string
  name: string
  type: string
  location: string
  vendorName: string
  price: number
  rating: number
  reviews: number
  status: 'active' | 'pending' | 'rejected'
  isFeatured: boolean
  images: string[]
  createdAt: string
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Hotel' | 'Home' | 'Villa'>('all')

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/properties`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setProperties(data.properties || [])
        } else {
          setProperties([
            { id: '1', name: 'Grand Palace Hotel', type: 'Hotel', location: 'Mumbai, MH', vendorName: 'John Doe', price: 5000, rating: 4.5, reviews: 120, status: 'active', isFeatured: true, images: [], createdAt: '2024-01-10' },
            { id: '2', name: 'Beach Resort', type: 'Hotel', location: 'Goa, GA', vendorName: 'Sarah Smith', price: 8000, rating: 4.8, reviews: 85, status: 'active', isFeatured: false, images: [], createdAt: '2024-02-15' },
            { id: '3', name: 'Mountain Homestay', type: 'Home', location: 'Manali, HP', vendorName: 'Mike Johnson', price: 2500, rating: 4.2, reviews: 45, status: 'pending', isFeatured: false, images: [], createdAt: '2024-03-01' },
            { id: '4', name: 'Luxury Villa', type: 'Villa', location: 'Pune, MH', vendorName: 'Priya Patel', price: 15000, rating: 4.9, reviews: 30, status: 'active', isFeatured: true, images: [], createdAt: '2024-03-05' },
          ])
        }
      } catch (error) {
        setProperties([
          { id: '1', name: 'Grand Palace Hotel', type: 'Hotel', location: 'Mumbai, MH', vendorName: 'John Doe', price: 5000, rating: 4.5, reviews: 120, status: 'active', isFeatured: true, images: [], createdAt: '2024-01-10' },
          { id: '2', name: 'Beach Resort', type: 'Hotel', location: 'Goa, GA', vendorName: 'Sarah Smith', price: 8000, rating: 4.8, reviews: 85, status: 'active', isFeatured: false, images: [], createdAt: '2024-02-15' },
          { id: '3', name: 'Mountain Homestay', type: 'Home', location: 'Manali, HP', vendorName: 'Mike Johnson', price: 2500, rating: 4.2, reviews: 45, status: 'pending', isFeatured: false, images: [], createdAt: '2024-03-01' },
          { id: '4', name: 'Luxury Villa', type: 'Villa', location: 'Pune, MH', vendorName: 'Priya Patel', price: 15000, rating: 4.9, reviews: 30, status: 'active', isFeatured: true, images: [], createdAt: '2024-03-05' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter
    const matchesType = typeFilter === 'all' || property.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleStatusChange = async (propertyId: string, newStatus: 'active' | 'rejected') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/properties/${propertyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      setProperties(properties.map(p => p.id === propertyId ? { ...p, status: newStatus } : p))
    } catch (error) {
      console.error('Failed to update property status')
    }
  }

  const handleFeaturedToggle = async (propertyId: string, isFeatured: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/properties/${propertyId}/featured`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured })
      })
      setProperties(properties.map(p => p.id === propertyId ? { ...p, isFeatured } : p))
    } catch (error) {
      console.error('Failed to toggle featured status')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage all properties on the platform</p>
        </div>
        <Link
          to="/properties/approval"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Pending Approval
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
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
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="Hotel">Hotel</option>
            <option value="Home">Home</option>
            <option value="Villa">Villa</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Home className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{property.name}</p>
                        <p className="text-sm text-gray-500">by {property.vendorName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {property.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {property.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{property.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{property.rating}</span>
                      <span className="text-gray-500 text-sm">({property.reviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      property.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : property.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleFeaturedToggle(property.id, !property.isFeatured)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.isFeatured
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {property.isFeatured ? 'Featured' : 'Normal'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/properties/${property.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                      <select
                        value={property.status}
                        onChange={(e) => handleStatusChange(property.id, e.target.value as 'active' | 'rejected')}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="active">Active</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProperties.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No properties found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}
