import { useState, useEffect, useRef, useCallback } from 'react'

export interface LiveRoomBooking {
  bookingId: string
  bookingNumber: string
  guestName: string
  phone: string
  status: string
  checkIn: string
  checkOut: string
}

export interface LiveRoom {
  roomId: string
  roomName: string
  roomType: string
  totalRooms: number
  filledRooms: number
  lockedRooms: number
  availableRooms: number
  bookings: LiveRoomBooking[]
}

export interface PropertyInventory {
  propertyId: string
  propertyName: string
  vendorName: string
  city: string
  rooms: LiveRoom[]
}

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'error'

interface UseInventoryStreamReturn {
  properties: PropertyInventory[]
  status: ConnectionStatus
  lastUpdated: Date | null
  reconnect: () => void
  errorCount: number
}

const getAccessToken = () => localStorage.getItem('admin_access_token')
const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function useInventoryStream(): UseInventoryStreamReturn {
  const [properties, setProperties] = useState<PropertyInventory[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const errorCountRef = useRef(0)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const token = getAccessToken()
    if (!token) {
      setStatus('error')
      return
    }

    setStatus('connecting')
    
    const url = `${getApiUrl()}/v1/inventory/live?token=${token}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      if (isMountedRef.current) {
        setStatus('live')
        errorCountRef.current = 0
      }
    }

    eventSource.onmessage = (event) => {
      if (!isMountedRef.current) return
      
      try {
        const data = JSON.parse(event.data) as PropertyInventory[]
        setProperties(data)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Failed to parse inventory snapshot:', err)
      }
    }

    eventSource.onerror = () => {
      if (!isMountedRef.current) return
      
      eventSource.close()
      setStatus('reconnecting')
      
      errorCountRef.current += 1
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      
      const delay = Math.min(2000 * Math.pow(1.5, errorCountRef.current), 30000)
      
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connect()
        }
      }, delay)
    }
  }, [])

  const reconnect = useCallback(() => {
    errorCountRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    isMountedRef.current = true
    connect()

    return () => {
      isMountedRef.current = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    properties,
    status,
    lastUpdated,
    reconnect,
    errorCount: errorCountRef.current,
  }
}
