import { PropertyInventory, LiveRoom, LiveRoomBooking } from '../../hooks/useInventoryStream'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { OccupancyBar } from './OccupancyBar'

interface RoomDetailProps {
  property: PropertyInventory
  onBack: () => void
}

interface RoomCellProps {
  status: 'available' | 'booked' | 'locked'
  booking?: LiveRoomBooking
}

function RoomCell({ status, booking }: RoomCellProps) {
  const colors = {
    available: 'bg-emerald-500 hover:bg-emerald-600',
    booked: 'bg-rose-500 hover:bg-rose-600',
    locked: 'bg-amber-500 hover:bg-amber-600',
  }

  const tooltips = {
    available: 'Available',
    booked: booking
      ? `${booking.guestName} (${booking.bookingNumber})\n${new Date(booking.checkIn).toLocaleDateString()} → ${new Date(booking.checkOut).toLocaleDateString()}`
      : 'Booked',
    locked: 'Temporarily locked',
  }

  return (
    <div
      className={`relative h-6 w-6 rounded ${colors[status]} cursor-help transition-colors`}
      title={tooltips[status]}
    >
      {status === 'booked' && booking && (
        <div className="absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 hover:opacity-100 pointer-events-none group-hover:opacity-100">
          <div className="font-medium">{booking.guestName}</div>
          <div className="text-slate-300">{booking.bookingNumber}</div>
          <div className="text-slate-400">
            {new Date(booking.checkIn).toLocaleDateString()} →{' '}
            {new Date(booking.checkOut).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}

function RoomTypeCard({ room }: { room: LiveRoom }) {
  const occupancyPercent =
    room.totalRooms > 0 ? (room.filledRooms / room.totalRooms) * 100 : 0

  const roomCells = []
  for (let i = 0; i < room.totalRooms; i++) {
    const booking = room.bookings[i]
    const lockedCount = room.lockedRooms

    if (i < room.filledRooms) {
      roomCells.push(
        <RoomCell
          key={i}
          status="booked"
          booking={booking}
        />
      )
    } else if (i < room.filledRooms + lockedCount) {
      roomCells.push(<RoomCell key={i} status="locked" />)
    } else {
      roomCells.push(<RoomCell key={i} status="available" />)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{room.roomName}</CardTitle>
          <span className="text-sm text-slate-500">{room.roomType}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-2">
            <p className="text-lg font-bold text-slate-900">{room.totalRooms}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="rounded-lg bg-emerald-50 py-2">
            <p className="text-lg font-bold text-emerald-600">{room.availableRooms}</p>
            <p className="text-xs text-emerald-600">Available</p>
          </div>
          <div className="rounded-lg bg-rose-50 py-2">
            <p className="text-lg font-bold text-rose-600">{room.filledRooms}</p>
            <p className="text-xs text-rose-600">Booked</p>
          </div>
          <div className="rounded-lg bg-amber-50 py-2">
            <p className="text-lg font-bold text-amber-600">{room.lockedRooms}</p>
            <p className="text-xs text-amber-600">Locked</p>
          </div>
        </div>

        <OccupancyBar
          filled={room.filledRooms}
          locked={room.lockedRooms}
          total={room.totalRooms}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Room Grid</p>
          <div className="flex flex-wrap gap-1">
            {roomCells.map((cell, i) => (
              <div key={i} className="group">
                {cell}
              </div>
            ))}
          </div>
        </div>

        {room.bookings.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Bookings ({room.bookings.length})
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {room.bookings.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {booking.guestName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {booking.bookingNumber} • {booking.phone}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(booking.checkIn).toLocaleDateString()} →{' '}
                      {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge
                    label={booking.status.replace('_', ' ')}
                    variant={booking.status === 'CHECKED_IN' ? 'success' : 'info'}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
            All rooms available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function RoomDetail({ property, onBack }: RoomDetailProps) {
  const totals = property.rooms.reduce(
    (acc, room) => ({
      total: acc.total + room.totalRooms,
      available: acc.available + room.availableRooms,
      booked: acc.booked + room.filledRooms,
      locked: acc.locked + room.lockedRooms,
    }),
    { total: 0, available: 0, booked: 0, locked: 0 }
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{property.propertyName}</h2>
          <p className="text-sm text-slate-500">
            {property.vendorName} • {property.city}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
          <p className="text-sm font-medium text-slate-500">Available</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{totals.available}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
          <p className="text-sm font-medium text-slate-500">Booked</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{totals.booked}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
          <p className="text-sm font-medium text-slate-500">Locked</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{totals.locked}</p>
        </div>
      </div>

      <div className="space-y-4">
        {property.rooms.map((room) => (
          <RoomTypeCard key={room.roomId} room={room} />
        ))}
      </div>
    </div>
  )
}
