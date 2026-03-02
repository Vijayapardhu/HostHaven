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

const emptyInventoryResponse = {
  data: [] as InventoryItem[],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
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
    if (params?.roomTypeId) {
      const response = await api.get(`/v1/admin/rooms/${params.roomTypeId}/inventory`, {
        params: { startDate: params?.startDate, endDate: params?.endDate },
      })
      const payload = response.data?.data ?? response.data
      const items = Array.isArray(payload) ? payload : payload?.inventory ?? []
      return {
        data: items as InventoryItem[],
        pagination: { total: items.length, page: 1, limit: items.length, totalPages: 1 },
      }
    }
    return emptyInventoryResponse
  },

  overrideInventory: async (roomId: string, date: string, availableRooms: number) => {
    const response = await api.put(`/v1/admin/rooms/${roomId}/inventory/override`, {
      date,
      availableRooms,
    })
    return response.data?.data ?? response.data
  },

  getInventoryByDate: async (
    propertyId: string,
    date: string
  ): Promise<InventoryItem[]> => {
    return []
  },

  getRoomInventory: async (roomId: string, startDate?: string, endDate?: string) => {
    const response = await api.get(`/v1/admin/rooms/${roomId}/inventory`, {
      params: { startDate, endDate },
    })
    return response.data?.data ?? response.data
  },

  resetOverride: async (propertyId: string, roomTypeId: string, date: string) => {
    const response = await api.delete(`/v1/admin/rooms/${roomTypeId}/locks`)
    return response.data?.data ?? response.data
  },

  releaseLocks: async (roomId: string, lockId?: string) => {
    const response = await api.delete(`/v1/admin/rooms/${roomId}/locks`, {
      params: lockId ? { lockId } : undefined,
    })
    return response.data?.data ?? response.data
  },

  bulkOverride: async (
    overrides: Array<{
      propertyId: string
      roomTypeId: string
      date: string
      overrideRooms: number
    }>
  ) => {
    const results = []
    for (const override of overrides) {
      const response = await api.put(`/v1/admin/rooms/${override.roomTypeId}/inventory/override`, {
        date: override.date,
        availableRooms: override.overrideRooms,
      })
      results.push(response.data?.data ?? response.data)
    }
    return results
  },

  blockRoomDates: async (roomId: string, startDate: string, endDate: string, quantity?: number) => {
    const response = await api.post(`/v1/admin/rooms/${roomId}/block`, {
      startDate,
      endDate,
      quantity,
    })
    return response.data?.data ?? response.data
  },

  cleanupLocks: async () => {
    const response = await api.post('/v1/admin/inventory/cleanup')
    return response.data?.data ?? response.data
  },
}
