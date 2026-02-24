import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, MapPin, Star, Clock, CheckCircle, XCircle, MoreVertical, Edit, Trash2, Image, DollarSign } from 'lucide-react'

interface Temple {
  id: string
  name: string
  slug: string
  description: string
  city: string
  state: string
  address: string
  deity: string
  templeType: string
  builtYear: string
  architecture: string
  entryFee: string
  dressCode: string
  bestTimeToVisit: string
  rating: number
  reviewCount: number
  images: string[]
  status: 'active' | 'draft'
  createdAt: string
}

export default function Temples() {
  const [temples, setTemples] = useState<Temple[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all')

  useEffect(() => {
    const fetchTemples = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/temples`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setTemples(data.temples || [])
        } else {
          setTemples([
            { id: '1', name: 'Tirumala Temple', slug: 'tirumala-temple', description: 'Famous Hindu temple dedicated to Lord Venkateswara', city: 'Tirupati', state: 'Andhra Pradesh', address: 'Tirumala, Tirupati', deity: 'Lord Venkateswara', templeType: 'Vaishnavite', builtYear: '300 AD', architecture: 'Dravidian', entryFee: 'Free', dressCode: 'Traditional', bestTimeToVisit: 'Oct-Mar', rating: 4.9, reviewCount: 5000, images: [], status: 'active', createdAt: '2024-01-10' },
            { id: '2', name: 'Venkateswara Temple', slug: 'venkateswara-temple', description: 'Beautiful temple with intricate carvings', city: 'Tirupati', state: 'Andhra Pradesh', address: 'Tirumala Road', deity: 'Lord Venkateswara', templeType: 'Vaishnavite', builtYear: '500 AD', architecture: 'Dravidian', entryFee: '₹50', dressCode: 'Traditional', bestTimeToVisit: 'Year round', rating: 4.7, reviewCount: 2500, images: [], status: 'active', createdAt: '2024-02-15' },
            { id: '3', name: 'Srivilliputhur Temple', slug: 'srivilliputhur-temple', description: 'Historic temple dedicated to Lord Vishnu', city: 'Srivilliputhur', state: 'Tamil Nadu', address: 'Srivilliputhur', deity: 'Lord Ranganatha', templeType: 'Vaishnavite', builtYear: '8th Century', architecture: 'Pandya', entryFee: 'Free', dressCode: 'Traditional', bestTimeToVisit: 'Nov-Feb', rating: 4.5, reviewCount: 1200, images: [], status: 'active', createdAt: '2024-03-01' },
            { id: '4', name: 'Kanaka Durga Temple', slug: 'kanaka-durga-temple', description: 'Goddess Kanaka Durga temple on Indrakeeladri', city: 'Vijayawada', state: 'Andhra Pradesh', address: 'Indrakeeladri Hills', deity: 'Goddess Kanaka Durga', templeType: 'Shakti', builtYear: '8th Century', architecture: 'Kakatiya', entryFee: 'Free', dressCode: 'Traditional', bestTimeToVisit: 'Oct-Mar', rating: 4.8, reviewCount: 3500, images: [], status: 'draft', createdAt: '2024-03-10' },
          ])
        }
      } catch (error) {
        setTemples([
          { id: '1', name: 'Tirumala Temple', slug: 'tirumala-temple', description: 'Famous Hindu temple', city: 'Tirupati', state: 'Andhra Pradesh', address: 'Tirumala', deity: 'Lord Venkateswara', templeType: 'Vaishnavite', builtYear: '300 AD', architecture: 'Dravidian', entryFee: 'Free', dressCode: 'Traditional', bestTimeToVisit: 'Oct-Mar', rating: 4.9, reviewCount: 5000, images: [], status: 'active', createdAt: '2024-01-10' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemples()
  }, [])

  const filteredTemples = temples.filter(temple => {
    const matchesSearch = temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      temple.deity.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || temple.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (templeId: string, newStatus: 'active' | 'draft') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/temples/${templeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      setTemples(temples.map(t => t.id === templeId ? { ...t, status: newStatus } : t))
    } catch (error) {
      console.error('Failed to update status')
    }
  }

  const getTempleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vaishnavite: 'Vaishnavite',
      shaivite: 'Shaivite',
      shakti: 'Shakti',
      vedic: 'Vedic',
      other: 'Other'
    }
    return labels[type.toLowerCase()] || type
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
          <h1 className="text-3xl font-bold text-gray-900">Temples</h1>
          <p className="text-gray-600 mt-1">Manage temple listings (content-only, no bookings)</p>
        </div>
        <Link
          to="/temples/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Temple
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Temples</p>
              <p className="text-2xl font-bold text-gray-900">{temples.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{temples.filter(t => t.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {(temples.reduce((acc, t) => acc + t.rating, 0) / temples.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
<div>
              <p className="text-sm text-gray-600">States</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(temples.map(t => t.state)).size}</p>
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
              placeholder="Search temples..."
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
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temple</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTemples.map((temple) => (
                <tr key={temple.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Image className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{temple.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{temple.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {temple.city}, {temple.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {temple.deity}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {getTempleTypeLabel(temple.templeType)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{temple.rating}</span>
                      <span className="text-gray-500 text-sm">({temple.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      {temple.entryFee}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      temple.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {temple.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/temples/${temple.id}/edit`}
                        className="text-primary hover:underline text-sm"
                      >
                        Edit
                      </Link>
                      <select
                        value={temple.status}
                        onChange={(e) => handleStatusChange(temple.id, e.target.value as 'active' | 'draft')}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTemples.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No temples found
          </div>
        )}
      </div>
    </div>
  )
}
