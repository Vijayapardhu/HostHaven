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
    return emptyInventoryResponse
  },

  overrideInventory: async (propertyId: string, overrides: InventoryOverride[]) => {
    throw new Error('Inventory override by property is not available on the backend')
  },

  getInventoryByDate: async (
    propertyId: string,
    date: string
  ): Promise<InventoryItem[]> => {
    return []
  },

  getRoomInventory: async (propertyId: string, roomTypeId: string) => {
    throw new Error('Room inventory endpoint is not available on the backend')
  },

  resetOverride: async (propertyId: string, roomTypeId: string, date: string) => {
    throw new Error('Inventory reset endpoint is not available on the backend')
  },

  bulkOverride: async (
    overrides: Array<{
      propertyId: string
      roomTypeId: string
      date: string
      overrideRooms: number
    }>
  ) => {
    throw new Error('Inventory bulk override endpoint is not available on the backend')
  },
}
