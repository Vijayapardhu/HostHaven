import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, MapPin, Star, User, Calendar, DollarSign, Eye, Edit, Trash2, CheckCircle, XCircle, Image } from 'lucide-react'

interface PropertyDetail {
  id: string
  name: string
  type: string
  location: string
  address: string
  description: string
  price: number
  rating: number
  reviewCount: number
  status: 'active' | 'pending' | 'rejected'
  isFeatured: boolean
  vendorName: string
  vendorId: string
  amenities: string[]
  images: string[]
  rooms: number
  createdAt: string
  recentBookings: {
    id: string
    userName: string
    checkIn: string
    checkOut: string
    amount: number
    status: string
  }[]
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/properties/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setProperty(data.property)
        } else {
          setProperty({
            id: id || '1',
            name: 'Grand Palace Hotel',
            type: 'Hotel',
            location: 'Mumbai, MH',
            address: '123 Marine Drive, Mumbai',
            description: 'Luxury 5-star hotel with stunning ocean views',
            price: 5000,
            rating: 4.5,
            reviewCount: 120,
            status: 'active',
            isFeatured: true,
            vendorName: 'John Doe',
            vendorId: 'V1',
            amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'Gym'],
            images: [],
            rooms: 50,
            createdAt: '2024-01-10',
            recentBookings: [
              { id: 'BK001', userName: 'Rahul Sharma', checkIn: '2024-03-20', checkOut: '2024-03-25', amount: 25000, status: 'confirmed' },
              { id: 'BK002', userName: 'Priya Patel', checkIn: '2024-03-22', checkOut: '2024-03-27', amount: 40000, status: 'confirmed' },
            ]
          })
        }
      } catch (error) {
        setProperty({
          id: id || '1',
          name: 'Grand Palace Hotel',
          type: 'Hotel',
          location: 'Mumbai, MH',
          address: '123 Marine Drive, Mumbai',
          description: 'Luxury 5-star hotel',
          price: 5000,
          rating: 4.5,
          reviewCount: 120,
          status: 'active',
          isFeatured: true,
          vendorName: 'John Doe',
          vendorId: 'V1',
          amenities: ['WiFi', 'Pool', 'Restaurant'],
          images: [],
          rooms: 50,
          createdAt: '2024-01-10',
          recentBookings: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const handleStatusChange = async (newStatus: 'active' | 'rejected') => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/properties/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (property) setProperty({ ...property, status: newStatus })
    } catch (error) {
      console.error('Failed to update status')
    }
  }

  const handleFeaturedToggle = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/properties/${id}/featured`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured: !property?.isFeatured })
      })
      if (property) setProperty({ ...property, isFeatured: !property.isFeatured })
    } catch (error) {
      console.error('Failed to toggle featured')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!property) return <div>Property not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/properties')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-600">{property.type} in {property.location}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFeaturedToggle}
            className={`px-4 py-2 rounded-lg border ${property.isFeatured ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-gray-300'}`}
          >
            {property.isFeatured ? '★ Featured' : '☆ Not Featured'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Property Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {property.images.length > 0 ? (
                property.images.map((img, index) => (
                  <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img src={img} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
                  <Image className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-700">{property.description}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
            <div className="space-y-3">
              {property.recentBookings.map((booking) => (
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
              {property.recentBookings.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent bookings</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                property.status === 'active' ? 'bg-green-100 text-green-700' :
                property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {property.status}
              </span>
            </div>
            <div className="space-y-3">
              <select
                value={property.status}
                onChange={(e) => handleStatusChange(e.target.value as 'active' | 'rejected')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Price per night</span>
                </div>
                <span className="font-bold">₹{property.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rooms</span>
                </div>
                <span className="font-bold">{property.rooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Rating</span>
                </div>
                <span className="font-bold">{property.rating} / 5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Reviews</span>
                </div>
                <span className="font-bold">{property.reviewCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Location</h2>
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{property.address}</p>
                <p className="text-gray-600">{property.location}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Vendor</h2>
            <button
              onClick={() => navigate(`/vendors/${property.vendorId}`)}
              className="w-full p-3 text-left border rounded-lg hover:bg-gray-50"
            >
              <p className="font-medium">{property.vendorName}</p>
              <p className="text-sm text-gray-500">View vendor details</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
