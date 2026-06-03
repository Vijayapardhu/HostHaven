import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Bell, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { bookingsService, type Booking } from '../lib/bookings'

// Sound notification function
const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
};

interface LiveBookingAlert {
  id: string
  bookingNumber: string
  propertyName: string
  userName: string
  amount: number
  status: string
  timestamp: Date
}

interface UseLiveBookingMonitorOptions {
  onNewBooking?: (booking: Booking) => void
  pollInterval?: number
  enabled?: boolean
}

export function useLiveBookingMonitor({
  onNewBooking,
  pollInterval = 30000,
  enabled = true,
}: UseLiveBookingMonitorOptions = {}) {
  const [alerts, setAlerts] = useState<LiveBookingAlert[]>([])
  const [lastFetchedId, setLastFetchedId] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const fetchLatestBookings = useCallback(async () => {
    if (!enabled) return

    try {
      const data = await bookingsService.getBookings({ limit: 5, status: 'CONFIRMED' })
      
      if (data.data.length > 0) {
        const latestBooking = data.data[0]
        
        if (!lastFetchedId || latestBooking.id !== lastFetchedId) {
          if (lastFetchedId) {
            // New booking detected - play sound
            playNotificationSound();
            
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
      console.error('Live booking monitor error:', error)
    }
  }, [enabled, lastFetchedId, onNewBooking])

  useEffect(() => {
    if (!enabled) return
    
    fetchLatestBookings()
    
    const interval = setInterval(fetchLatestBookings, pollInterval)
    
    return () => {
      clearInterval(interval)
      setIsMonitoring(false)
    }
  }, [enabled, pollInterval, fetchLatestBookings])

  const clearAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const clearAllAlerts = () => {
    setAlerts([])
  }

  return {
    alerts,
    isMonitoring,
    clearAlert,
    clearAllAlerts,
    refresh: fetchLatestBookings,
  }
}

export function LiveBookingToasts({ 
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

export default useLiveBookingMonitor
