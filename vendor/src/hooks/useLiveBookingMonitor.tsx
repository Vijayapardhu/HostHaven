import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Clock, CheckCircle, X } from 'lucide-react'
import { bookingsService, type Booking } from '../lib/bookings'
import { handleError } from '../lib/errorHandler'

interface LiveBookingAlert {
  id: string
  bookingNumber: string
  propertyName: string
  userName: string
  amount: number
  status: string
  timestamp: Date
}

interface UseVendorLiveBookingMonitorOptions {
  onNewBooking?: (booking: Booking) => void
  pollInterval?: number
  enabled?: boolean
}

export function useVendorLiveBookingMonitor({
  onNewBooking,
  pollInterval = 30000,
  enabled = true,
}: UseVendorLiveBookingMonitorOptions = {}) {
  const [alerts, setAlerts] = useState<LiveBookingAlert[]>([])
  const [lastFetchedId, setLastFetchedId] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [newBookingsCount, setNewBookingsCount] = useState(0)

  const fetchLatestVendorBookings = useCallback(async () => {
    if (!enabled) return

    try {
      const data = await bookingsService.getVendorBookings({ limit: '5', status: 'CONFIRMED' })
      
      if (data.data.length > 0) {
        const latestBooking = data.data[0]
        
        if (!lastFetchedId || latestBooking.id !== lastFetchedId) {
          if (lastFetchedId) {
            const newBooking: LiveBookingAlert = {
              id: latestBooking.id,
              bookingNumber: latestBooking.bookingNumber || latestBooking.id,
              propertyName: latestBooking.property?.name || 'Property',
              userName: latestBooking.user?.name || 'Guest',
              amount: latestBooking.totalAmount,
              status: latestBooking.status,
              timestamp: new Date(),
            }
            
            setAlerts(prev => [newBooking, ...prev].slice(0, 10))
            setNewBookingsCount(prev => prev + 1)
            
            toast.success(`New booking received! ₹${latestBooking.totalAmount.toLocaleString()}`, {
              description: `${newBooking.propertyName} - ${newBooking.userName}`,
              duration: 5000,
            })
            
            onNewBooking?.(latestBooking)
          }
          
          setLastFetchedId(latestBooking.id)
        }
      }
      
      setIsMonitoring(true)
    } catch (error) {
      handleError(error, 'booking');
    }
  }, [enabled, lastFetchedId, onNewBooking])

  useEffect(() => {
    if (!enabled) return
    
    fetchLatestVendorBookings()
    
    const interval = setInterval(fetchLatestVendorBookings, pollInterval)
    
    return () => {
      clearInterval(interval)
      setIsMonitoring(false)
    }
  }, [enabled, pollInterval, fetchLatestVendorBookings])

  const clearAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const clearAllAlerts = () => {
    setAlerts([])
    setNewBookingsCount(0)
  }

  const resetNewBookingsCount = () => {
    setNewBookingsCount(0)
  }

  return {
    alerts,
    isMonitoring,
    newBookingsCount,
    clearAlert,
    clearAllAlerts,
    resetNewBookingsCount,
    refresh: fetchLatestVendorBookings,
  }
}

export function VendorLiveBookingToasts({ 
  alerts, 
  onDismiss 
}: { 
  alerts: LiveBookingAlert[]
  onDismiss: (id: string) => void
}) {
  if (alerts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {alerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">New Booking!</p>
                <p className="text-xs text-gray-500">#{alert.bookingNumber}</p>
              </div>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-sm">
            <p className="font-medium text-gray-900">₹{alert.amount.toLocaleString()}</p>
            <p className="text-gray-600">{alert.propertyName}</p>
            <p className="text-gray-500 text-xs">{alert.userName}</p>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{alert.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default useVendorLiveBookingMonitor
