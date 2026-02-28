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
    // Note: The global property inventory list might not exist yet, 
    // but we have getRoomInventory. I'll implement getRoomInventory for now.
    const response = await api.get(`/v1/admin/rooms/${propertyId}/inventory`, { params })
    return response.data?.data ?? response.data
  },

  getRoomInventory: async (roomId: string, startDate: string, endDate: string) => {
    const response = await api.get(`/v1/admin/rooms/${roomId}/inventory`, {
      params: { startDate, endDate }
    })
    return response.data?.data ?? response.data
  },

  overrideInventory: async (roomId: string, date: string, availableRooms: number) => {
    const response = await api.put(`/v1/admin/rooms/${roomId}/inventory/override`, {
      date,
      availableRooms
    })
    return response.data?.data ?? response.data
  },

  blockDates: async (roomId: string, checkInDate: string, checkOutDate: string, quantity: number) => {
    const response = await api.post(`/v1/admin/rooms/${roomId}/block`, {
      checkInDate,
      checkOutDate,
      quantity
    })
    return response.data?.data ?? response.data
  },

  releaseLocks: async (roomId: string, lockId?: string) => {
    const response = await api.delete(`/v1/admin/rooms/${roomId}/locks`, {
      params: { lockId }
    })
    return response.data?.data ?? response.data
  },

  cleanupLocks: async () => {
    const response = await api.post('/v1/admin/inventory/cleanup')
    return response.data?.data ?? response.data
  },

  resetOverride: async () => {
    // For now using releaseLocks or overrideInventory(totalRooms)
    throw new Error('Use overrideInventory with totalRooms to reset.')
  },
}
