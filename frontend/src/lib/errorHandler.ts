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

// Messages containing these read as code, not copy, and are never shown raw.
const TECHNICAL_MARKERS = [
  'TypeError',
  'SyntaxError',
  'ReferenceError',
  'Unexpected token',
  '[object',
  'is not a function',
  'undefined',
  'null',
]

/**
 * True when a message is safe to show verbatim. The API client surfaces the
 * backend's own user-facing copy (e.g. "Sorry, these rooms are no longer
 * available for your selected dates.") — discarding it for a generic string
 * hid the actual reason from users on every failure.
 */
function isDisplayableMessage(message: string): boolean {
  const trimmed = message.trim()
  if (trimmed.length < 4 || trimmed.length > 300) return false
  return !TECHNICAL_MARKERS.some((marker) => trimmed.includes(marker))
}

function getFriendlyMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.'

  const errorStr = error instanceof Error ? error.message : String(error)

  // Transport-level failures get a friendlier translation.
  for (const [key, message] of Object.entries(DEFAULT_ERROR_MESSAGES)) {
    if (errorStr.includes(key)) {
      return message
    }
  }

  // Everything else that reads as human copy is the backend's own message.
  if (isDisplayableMessage(errorStr)) {
    return errorStr
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
    'invoice': 'Invoice Error',
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
