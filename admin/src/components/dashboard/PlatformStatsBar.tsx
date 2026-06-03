import { PropertyInventory } from '../../hooks/useInventoryStream'

interface PlatformStatsBarProps {
  properties: PropertyInventory[]
}

export function PlatformStatsBar({ properties }: PlatformStatsBarProps) {
  const stats = properties.reduce(
    (acc, property) => {
      property.rooms.forEach((room) => {
        acc.totalRooms += room.totalRooms
        acc.bookedRooms += room.filledRooms
        acc.availableRooms += room.availableRooms
      })
      return acc
    },
    { totalRooms: 0, bookedRooms: 0, availableRooms: 0 }
  )

  const statCards = [
    {
      label: 'Properties',
      value: properties.length,
      color: 'text-slate-900',
    },
    {
      label: 'Total Rooms',
      value: stats.totalRooms,
      color: 'text-slate-900',
    },
    {
      label: 'Booked Today',
      value: stats.bookedRooms,
      color: 'text-rose-600',
    },
    {
      label: 'Available',
      value: stats.availableRooms,
      color: 'text-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-200 bg-white px-5 py-4"
        >
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
