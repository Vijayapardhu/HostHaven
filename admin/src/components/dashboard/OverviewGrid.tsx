import { PropertyInventory, LiveRoom } from '../../hooks/useInventoryStream'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { OccupancyBar } from './OccupancyBar'

interface PropertyCardProps {
  property: PropertyInventory
  onClick: () => void
}

function PropertyCard({ property, onClick }: PropertyCardProps) {
  const totals = property.rooms.reduce(
    (acc, room) => ({
      total: acc.total + room.totalRooms,
      available: acc.available + room.availableRooms,
      booked: acc.booked + room.filledRooms,
      locked: acc.locked + room.lockedRooms,
    }),
    { total: 0, available: 0, booked: 0, locked: 0 }
  )

  const occupancyPercent = totals.total > 0 ? (totals.booked / totals.total) * 100 : 0

  const topRooms = [...property.rooms]
    .sort((a, b) => b.totalRooms - a.totalRooms)
    .slice(0, 3)

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-slate-300"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{property.propertyName}</CardTitle>
        <p className="text-sm text-slate-500">
          {property.vendorName} • {property.city}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Occupancy</span>
          <span className="font-medium">{occupancyPercent.toFixed(0)}%</span>
        </div>

        <OccupancyBar
          filled={totals.booked}
          locked={totals.locked}
          total={totals.total}
        />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-2">
            <p className="text-lg font-bold text-slate-900">{totals.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="rounded-lg bg-emerald-50 py-2">
            <p className="text-lg font-bold text-emerald-600">{totals.available}</p>
            <p className="text-xs text-emerald-600">Available</p>
          </div>
          <div className="rounded-lg bg-rose-50 py-2">
            <p className="text-lg font-bold text-rose-600">{totals.booked}</p>
            <p className="text-xs text-rose-600">Booked</p>
          </div>
        </div>

        {topRooms.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">Top Room Types</p>
            {topRooms.map((room) => (
              <div key={room.roomId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{room.roomName}</span>
                <span className="text-slate-500">
                  {room.availableRooms}/{room.totalRooms}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface OverviewGridProps {
  properties: PropertyInventory[]
  onSelectProperty: (property: PropertyInventory) => void
}

export function OverviewGrid({ properties, onSelectProperty }: OverviewGridProps) {
  if (properties.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">No properties found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property.propertyId}
          property={property}
          onClick={() => onSelectProperty(property)}
        />
      ))}
    </div>
  )
}
