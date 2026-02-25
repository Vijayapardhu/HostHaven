import api from './api'

export interface InventoryItem {
  id: string
  propertyId: string
  roomTypeId: string
  roomTypeName: string
  date: string
  totalRooms: number
  bookedRooms: number
  availableRooms: number
  overrideRooms?: number
  overriddenAt?: string
  overriddenBy?: string
}

export interface InventoryOverride {
  roomTypeId: string
  date: string
  overrideRooms: number
}

export const inventoryService = {
  getPropertyInventory: async (
    propertyId: string,
    params?: {
      startDate?: string
      endDate?: string
      roomTypeId?: string
    }
  ) => {
    const response = await api.get(`/v1/admin/inventory/properties/${propertyId}`, { params })
    return response.data
  },

  overrideInventory: async (propertyId: string, overrides: InventoryOverride[]) => {
    const response = await api.post(`/v1/admin/inventory/properties/${propertyId}/override`, {
      overrides,
    })
    return response.data
  },

  getInventoryByDate: async (
    propertyId: string,
    date: string
  ): Promise<InventoryItem[]> => {
    const response = await api.get(`/v1/admin/inventory/properties/${propertyId}/${date}`)
    return response.data
  },

  getRoomInventory: async (propertyId: string, roomTypeId: string) => {
    const response = await api.get(
      `/v1/admin/inventory/properties/${propertyId}/rooms/${roomTypeId}`
    )
    return response.data
  },

  resetOverride: async (propertyId: string, roomTypeId: string, date: string) => {
    const response = await api.delete(
      `/v1/admin/inventory/properties/${propertyId}/rooms/${roomTypeId}/${date}`
    )
    return response.data
  },

  bulkOverride: async (
    overrides: Array<{
      propertyId: string
      roomTypeId: string
      date: string
      overrideRooms: number
    }>
  ) => {
    const response = await api.post('/v1/admin/inventory/bulk-override', { overrides })
    return response.data
  },
}
