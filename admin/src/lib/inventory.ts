import api from './api'

export const inventoryService = {
  getAllPropertiesInventory: async (date?: string, vendorId?: string) => {
    const response = await api.get('/v1/admin/inventory/properties', {
      params: { 
        date, 
        vendorId: vendorId || undefined 
      },
    })
    return response.data?.data ?? response.data
  },

  getVendors: async () => {
    const response = await api.get('/v1/admin/vendors', {
      params: { limit: 100 },
    })
    return response.data?.data ?? response.data
  },

  overrideInventory: async (roomId: string, date: string, availableRooms: number) => {
    const response = await api.put(`/v1/admin/rooms/${roomId}/inventory/override`, {
      date,
      availableRooms,
    })
    return response.data?.data ?? response.data
  },

  releaseLocks: async (roomId: string, lockId?: string) => {
    const response = await api.delete(`/v1/admin/rooms/${roomId}/locks`, {
      params: lockId ? { lockId } : undefined,
    })
    return response.data?.data ?? response.data
  },

  blockRoomDates: async (roomId: string, startDate: string, endDate: string, quantity?: number) => {
    const response = await api.post(`/v1/admin/rooms/${roomId}/block`, {
      startDate,
      endDate,
      quantity,
    })
    return response.data?.data ?? response.data
  },

  getRoomInventory: async (roomId: string, startDate?: string, endDate?: string) => {
    const response = await api.get(`/v1/admin/rooms/${roomId}/inventory`, {
      params: { startDate, endDate },
    })
    return response.data?.data ?? response.data
  },

  cleanupLocks: async () => {
    const response = await api.post('/v1/admin/inventory/cleanup')
    return response.data?.data ?? response.data
  },
}
