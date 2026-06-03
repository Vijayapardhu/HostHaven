import { toast } from 'sonner'

type ErrorLevel = 'error' | 'warning' | 'info'

interface ErrorHandlerOptions {
  level?: ErrorLevel
  title?: string
  duration?: number
}

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  'Failed to fetch': 'Unable to connect to server. Please check your internet connection.',
  'Network request failed': 'Network error. Please try again.',
  '401': 'Your session has expired. Please log in again.',
  '403': 'You do not have permission to perform this action.',
  '404': 'The requested resource was not found.',
  '500': 'Server error. Please try again later.',
  'timeout': 'Request timed out. Please try again.',
}

function getFriendlyMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.'
  
  const errorStr = error instanceof Error ? error.message : String(error)
  
  for (const [key, message] of Object.entries(DEFAULT_ERROR_MESSAGES)) {
    if (errorStr.includes(key)) {
      return message
    }
  }
  
  return 'Something went wrong. Please try again.'
}

function getErrorTitle(context: string): string {
  const titles: Record<string, string> = {
    'api': 'Connection Error',
    'auth': 'Authentication Error',
    'push': 'Notification Error',
    'booking': 'Booking Error',
    'payment': 'Payment Error',
    'property': 'Property Error',
    'dashboard': 'Dashboard Error',
    'default': 'Error',
  }
  
  return titles[context] || titles.default
}

export function handleError(
  error: unknown,
  context: string = 'default',
  options: ErrorHandlerOptions = {}
): void {
  const { level = 'error', title, duration = 4000 } = options
  
  const message = getFriendlyMessage(error)
  const errorTitle = title || getErrorTitle(context)
  
  if (level === 'warning') {
    toast.warning(message, { duration })
  } else if (level === 'info') {
    toast.info(message, { duration })
  } else {
    toast.error(errorTitle, {
      description: message,
      duration,
    })
  }
}

export function handleSuccess(message: string, description?: string): void {
  if (description) {
    toast.success(message, { description })
  } else {
    toast.success(message)
  }
}

export function handleInfo(message: string, description?: string): void {
  if (description) {
    toast.info(message, { description })
  } else {
    toast.info(message)
  }
}
