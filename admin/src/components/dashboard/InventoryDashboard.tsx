import { useState, useEffect } from 'react'
import { useInventoryStream, PropertyInventory } from '../../hooks/useInventoryStream'
import { PageHeader } from '../ui/PageHeader'
import { ConnectionStatusBadge } from './ConnectionStatusBadge'
import { PlatformStatsBar } from './PlatformStatsBar'
import { OverviewGrid } from './OverviewGrid'
import { RoomDetail } from './RoomDetail'
import { InventorySkeleton } from './InventorySkeleton'
import { Legend } from './Legend'

export function InventoryDashboard() {
  const { properties, status, lastUpdated, reconnect } = useInventoryStream()
  const [selectedProperty, setSelectedProperty] = useState<PropertyInventory | null>(null)

  useEffect(() => {
    if (selectedProperty && properties.length > 0) {
      const updated = properties.find(
        (p) => p.propertyId === selectedProperty.propertyId
      )
      if (updated) {
        setSelectedProperty(updated)
      }
    }
  }, [properties, selectedProperty])

  const showSkeleton = status === 'connecting' && properties.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Inventory Dashboard"
          description="Real-time room availability across all properties"
        />
        <ConnectionStatusBadge
          status={status}
          lastUpdated={lastUpdated}
          onRetry={reconnect}
        />
      </div>

      <PlatformStatsBar properties={properties} />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {selectedProperty ? selectedProperty.propertyName : 'All Properties'}
        </h3>
        <Legend />
      </div>

      {showSkeleton ? (
        <InventorySkeleton />
      ) : selectedProperty ? (
        <RoomDetail
          property={selectedProperty}
          onBack={() => setSelectedProperty(null)}
        />
      ) : (
        <OverviewGrid
          properties={properties}
          onSelectProperty={setSelectedProperty}
        />
      )}
    </div>
  )
}
