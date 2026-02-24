import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, MapPin, DollarSign, Star, CheckCircle, XCircle, MoreVertical, Edit, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  category: string
  description: string
  price: number
  priceUnit: string
  duration: string
  vendorName: string
  rating: number
  reviewCount: number
  isActive: boolean
  isVerified: boolean
  images: string[]
  createdAt: string
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'transport' | 'guide' | 'photography' | 'food' | 'other'>('all')

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/services`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setServices(data.services || [])
        } else {
          setServices([
            { id: '1', name: 'Airport Pickup', category: 'transport', description: 'Professional airport pickup service', price: 1500, priceUnit: 'per_trip', duration: '1 hour', vendorName: 'John Travels', rating: 4.5, reviewCount: 25, isActive: true, isVerified: true, images: [], createdAt: '2024-01-15' },
            { id: '2', name: 'Local Guide', category: 'guide', description: 'Expert local guide for sightseeing', price: 2000, priceUnit: 'per_person', duration: '8 hours', vendorName: 'Sarah Tours', rating: 4.8, reviewCount: 45, isActive: true, isVerified: true, images: [], createdAt: '2024-02-10' },
            { id: '3', name: 'Photography Session', category: 'photography', description: 'Professional photography at temples', price: 3000, priceUnit: 'per_session', duration: '2 hours', vendorName: 'Photo Masters', rating: 4.2, reviewCount: 15, isActive: true, isVerified: false, images: [], createdAt: '2024-03-01' },
            { id: '4', name: 'Traditional Meal', category: 'food', description: 'Authentic South Indian meal experience', price: 500, priceUnit: 'per_person', duration: '1 hour', vendorName: 'Heritage Kitchen', rating: 4.9, reviewCount: 120, isActive: true, isVerified: true, images: [], createdAt: '2024-01-20' },
          ])
        }
      } catch (error) {
        setServices([
          { id: '1', name: 'Airport Pickup', category: 'transport', description: 'Professional airport pickup service', price: 1500, priceUnit: 'per_trip', duration: '1 hour', vendorName: 'John Travels', rating: 4.5, reviewCount: 25, isActive: true, isVerified: true, images: [], createdAt: '2024-01-15' },
          { id: '2', name: 'Local Guide', category: 'guide', description: 'Expert local guide for sightseeing', price: 2000, priceUnit: 'per_person', duration: '8 hours', vendorName: 'Sarah Tours', rating: 4.8, reviewCount: 45, isActive: true, isVerified: true, images: [], createdAt: '2024-02-10' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [])

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleToggleActive = async (serviceId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      })
      setServices(services.map(s => s.id === serviceId ? { ...s, isActive } : s))
    } catch (error) {
      console.error('Failed to toggle service status')
    }
  }

  const handleVerify = async (serviceId: string, isVerified: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/services/${serviceId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified })
      })
      setServices(services.map(s => s.id === serviceId ? { ...s, isVerified } : s))
    } catch (error) {
      console.error('Failed to verify service')
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      transport: 'Transport',
      guide: 'Guide',
      photography: 'Photography',
      food: 'Food & Dining',
      other: 'Other'
    }
    return labels[category] || category
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
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage travel services on the platform</p>
        </div>
        <Link
          to="/services/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.isVerified).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(services.map(s => s.category)).size}</p>
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
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="transport">Transport</option>
            <option value="guide">Guide</option>
            <option value="photography">Photography</option>
            <option value="food">Food & Dining</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.duration}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {getCategoryLabel(service.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {service.vendorName}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{service.price.toLocaleString()}
                    <span className="text-gray-500 text-sm">/{service.priceUnit.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{service.rating}</span>
                      <span className="text-gray-500 text-sm">({service.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {service.isVerified ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => handleVerify(service.id, true)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(service.id, !service.isActive)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/services/${service.id}/edit`}
                        className="text-primary hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No services found
          </div>
        )}
      </div>
    </div>
  )
}
