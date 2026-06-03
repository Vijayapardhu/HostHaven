import { cn } from '../../lib/utils'
import { ConnectionStatus } from '../../hooks/useInventoryStream'

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus
  lastUpdated: Date | null
  onRetry?: () => void
}

export function ConnectionStatusBadge({ status, lastUpdated, onRetry }: ConnectionStatusBadgeProps) {
  const statusConfig = {
    connecting: {
      label: 'Connecting...',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: (
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
    },
    live: {
      label: 'Live',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />,
    },
    reconnecting: {
      label: 'Reconnecting...',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: (
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
    },
    error: {
      label: 'Disconnected',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      ),
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium',
          config.bg,
          config.text,
          config.border
        )}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>
      {lastUpdated && (
        <span className="text-xs text-slate-500">
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-rose-600 hover:text-rose-700 underline"
        >
          Retry now
        </button>
      )}
    </div>
  )
}
