import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { 
  Building2, 
  BedDouble, 
  Users, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
  CheckCircle,
  Filter
} from 'lucide-react'
import { inventoryService } from '../lib/inventory'
import type { PropertyInventory } from '../hooks/useInventoryStream'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoader } from '../components/ui/PageLoader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'

interface Vendor {
  id: string
  businessName: string
}

export default function Inventory() {
  const [properties, setProperties] = useState<PropertyInventory[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all')
  const [selectedProperty, setSelectedProperty] = useState<PropertyInventory | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'overview' | 'rooms'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch vendors on mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await inventoryService.getVendors()
        const vendorsList = Array.isArray(data) ? data : data?.vendors || []
        setVendors(vendorsList)
      } catch (err) {
        console.error('Failed to load vendors', err)
      }
    }
    fetchVendors()
  }, [])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const vendorId = selectedVendorId === 'all' ? undefined : selectedVendorId
      const data = await inventoryService.getAllPropertiesInventory(selectedDate, vendorId)
      const propertiesData = Array.isArray(data) ? data : data?.inventory || []
      setProperties(propertiesData)
      
      if (propertiesData.length > 0 && !selectedProperty) {
        setSelectedProperty(propertiesData[0])
      } else if (propertiesData.length > 0 && selectedProperty) {
        // Keep selected property if it still exists
        const stillExists = propertiesData.find((p: PropertyInventory) => p.propertyId === selectedProperty?.propertyId)
        if (!stillExists) {
          setSelectedProperty(propertiesData[0])
        }
      } else {
        setSelectedProperty(null)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [selectedDate, selectedVendorId])

  const getPropertyStats = (property: PropertyInventory) => {
    const totalRooms = property.rooms.reduce((sum, r) => sum + r.totalRooms, 0)
    const filledRooms = property.rooms.reduce((sum, r) => sum + r.filledRooms, 0)
    const availableRooms = property.rooms.reduce((sum, r) => sum + r.availableRooms, 0)
    return { totalRooms, filledRooms, availableRooms }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Booking Inventory"
        description="Real-time room availability across all properties and vendors"
      />

      {/* Date Navigator & Vendor Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-medium">{formatDate(selectedDate)}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          Today
        </Button>

        {/* Vendor Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.businessName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-slate-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-400"></div>
          <span className="text-sm text-slate-600">Unavailable</span>
        </div>
      </div>

      {/* Properties Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => {
            const stats = getPropertyStats(property)
            return (
              <Card 
                key={property.propertyId} 
                className="cursor-pointer hover:shadow-lg transition-all hover:border-slate-400"
                onClick={() => {
                  setSelectedProperty(property)
                  setViewMode('rooms')
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    {property.propertyName}
                  </CardTitle>
                  <p className="text-sm text-slate-500">{property.vendorName}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.totalRooms}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.availableRooms}</p>
                      <p className="text-xs text-slate-500">Available</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{stats.filledRooms}</p>
                      <p className="text-xs text-slate-500">Filled</p>
                    </div>
                  </div>
                  
                  {/* Room Type Breakdown */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-slate-500 mb-2">Room Types</p>
                    <div className="space-y-2">
                      {property.rooms.map((room) => (
                        <div key={room.roomId} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{room.roomName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">{room.availableRooms}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-red-600">{room.filledRooms}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          
          {properties.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-slate-500">No properties found</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Room Detail View */}
      {viewMode === 'rooms' && selectedProperty && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setViewMode('overview')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                {selectedProperty.propertyName}
              </h2>
              <p className="text-slate-500">{selectedProperty.vendorName} • {formatDate(selectedDate)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {selectedProperty.rooms.reduce((s, r) => s + r.availableRooms, 0)}
                </p>
                <p className="text-xs text-slate-500">Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {selectedProperty.rooms.reduce((s, r) => s + r.filledRooms, 0)}
                </p>
                <p className="text-xs text-slate-500">Booked</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {selectedProperty.rooms.reduce((s, r) => s + r.totalRooms, 0)}
                </p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>

          {selectedProperty.rooms.map((room) => (
            <Card key={room.roomId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-indigo-600" />
                    {room.roomName}
                  </div>
                  <StatusBadge label={room.roomType} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Room Grid Visualization */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Room Status Grid:</span>
                    <span className="text-xs text-slate-500">
                      ({room.availableRooms} available / {room.filledRooms} booked / {room.totalRooms} total)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: room.totalRooms }).map((_, idx) => {
                      const isBooked = idx < room.filledRooms
                      const booking = room.bookings[idx]
                      
                      return (
                        <div
                          key={idx}
                          className={`
                            w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium transition-all cursor-pointer
                            ${isBooked 
                              ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
                            }
                          `}
                          title={isBooked ? `Guest: ${booking?.guestName || 'Guest'}` : 'Available'}
                        >
                          {idx + 1}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Booking Details */}
                {room.bookings.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Current Bookings ({room.bookings.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {room.bookings.map((booking) => (
                        <div 
                          key={booking.bookingId}
                          className="p-3 rounded-lg bg-red-50 border border-red-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-sm">{booking.guestName}</span>
                            <StatusBadge 
                              label={booking.status === 'CHECKED_IN' ? 'Checked In' : 'Confirmed'}
                              variant="success"
                            />
                          </div>
                          <div className="space-y-1 text-xs text-slate-600">
                            <p className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              #{booking.bookingNumber}
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {booking.phone || 'No phone'}
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {room.bookings.length === 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">All rooms available for this type</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {selectedProperty.rooms.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-slate-500">No rooms configured for this property</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
