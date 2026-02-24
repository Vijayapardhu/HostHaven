import { useEffect, useState } from 'react'
import { Search, Home, Calendar, Ban, Plus, X, CheckCircle, AlertCircle } from 'lucide-react'

interface InventoryOverride {
  id: string
  propertyId: string
  propertyName: string
  roomId: string
  roomName: string
  date: string
  overrideType: 'block' | 'availability'
  overrideValue: number
  reason: string
  createdBy: string
  createdAt: string
}

interface EmergencyBlock {
  id: string
  propertyId: string
  propertyName: string
  reason: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export default function Inventory() {
  const [overrides, setOverrides] = useState<InventoryOverride[]>([])
  const [emergencyBlocks, setEmergencyBlocks] = useState<EmergencyBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overrides' | 'blocks'>('overrides')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        
        const [overridesRes, blocksRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/inventory/overrides`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/admin/inventory/blocks`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (overridesRes.ok) {
          const data = await overridesRes.json()
          setOverrides(data.overrides || [])
        } else {
          setOverrides([
            { id: '1', propertyId: 'P1', propertyName: 'Grand Palace Hotel', roomId: 'R1', roomName: 'Deluxe Room', date: '2024-03-25', overrideType: 'block', overrideValue: 0, reason: 'Maintenance', createdBy: 'Admin', createdAt: '2024-03-20' },
            { id: '2', propertyId: 'P2', propertyName: 'Beach Resort', roomId: 'R2', roomName: 'Suite', date: '2024-03-26', overrideType: 'availability', overrideValue: 2, reason: 'Extra inventory', createdBy: 'Admin', createdAt: '2024-03-21' },
          ])
        }

        if (blocksRes.ok) {
          const data = await blocksRes.json()
          setEmergencyBlocks(data.blocks || [])
        } else {
          setEmergencyBlocks([
            { id: '1', propertyId: 'P1', propertyName: 'Grand Palace Hotel', reason: 'Water supply issue', startDate: '2024-03-22', endDate: '2024-03-24', isActive: false, createdAt: '2024-03-22' },
            { id: '2', propertyId: 'P3', propertyName: 'Mountain View Resort', reason: 'Emergency repairs', startDate: '2024-03-28', endDate: '2024-03-30', isActive: true, createdAt: '2024-03-25' },
          ])
        }
      } catch (error) {
        setOverrides([
          { id: '1', propertyId: 'P1', propertyName: 'Grand Palace Hotel', roomId: 'R1', roomName: 'Deluxe Room', date: '2024-03-25', overrideType: 'block', overrideValue: 0, reason: 'Maintenance', createdBy: 'Admin', createdAt: '2024-03-20' },
          { id: '2', propertyId: 'P2', propertyName: 'Beach Resort', roomId: 'R2', roomName: 'Suite', date: '2024-03-26', overrideType: 'availability', overrideValue: 2, reason: 'Extra inventory', createdBy: 'Admin', createdAt: '2024-03-21' },
        ])
        setEmergencyBlocks([
          { id: '1', propertyId: 'P1', propertyName: 'Grand Palace Hotel', reason: 'Water supply issue', startDate: '2024-03-22', endDate: '2024-03-24', isActive: false, createdAt: '2024-03-22' },
          { id: '2', propertyId: 'P3', propertyName: 'Mountain View Resort', reason: 'Emergency repairs', startDate: '2024-03-28', endDate: '2024-03-30', isActive: true, createdAt: '2024-03-25' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredOverrides = overrides.filter(o =>
    o.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.roomName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBlocks = emergencyBlocks.filter(b =>
    b.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRemoveOverride = async (overrideId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/inventory/overrides/${overrideId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setOverrides(overrides.filter(o => o.id !== overrideId))
    } catch (error) {
      console.error('Failed to remove override')
    }
  }

  const handleToggleBlock = async (blockId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`${import.meta.env.VITE_API_URL}/admin/inventory/blocks/${blockId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      })
      setEmergencyBlocks(emergencyBlocks.map(b => b.id === blockId ? { ...b, isActive } : b))
    } catch (error) {
      console.error('Failed to toggle block')
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage availability overrides and emergency blocks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Overrides</p>
              <p className="text-2xl font-bold text-gray-900">{overrides.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Blocks</p>
              <p className="text-2xl font-bold text-gray-900">{emergencyBlocks.filter(b => b.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Blocks</p>
              <p className="text-2xl font-bold text-gray-900">{emergencyBlocks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex gap-4 p-4">
            <button
              onClick={() => setActiveTab('overrides')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overrides'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Availability Overrides
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'blocks'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Emergency Blocks
            </button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {activeTab === 'overrides' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOverrides.map((override) => (
                  <tr key={override.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{override.propertyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{override.roomName}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(override.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        override.overrideType === 'block'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {override.overrideType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{override.overrideValue}</td>
                    <td className="px-6 py-4 text-gray-600">{override.reason}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveOverride(override.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOverrides.length === 0 && (
              <div className="p-8 text-center text-gray-500">No overrides found</div>
            )}
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBlocks.map((block) => (
                  <tr key={block.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{block.propertyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{block.reason}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(block.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(block.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        block.isActive
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {block.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(block.id, !block.isActive)}
                        className={`text-sm ${block.isActive ? 'text-gray-600 hover:text-gray-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {block.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBlocks.length === 0 && (
              <div className="p-8 text-center text-gray-500">No emergency blocks found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
