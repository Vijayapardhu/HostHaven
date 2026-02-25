import { cn } from '../../lib/utils'

type StateTone = 'info' | 'success' | 'warning' | 'danger'

interface StateBannerProps {
  title: string
  description?: string
  tone?: StateTone
  className?: string
}

const toneStyles: Record<StateTone, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
}

export function StateBanner({ title, description, tone = 'info', className }: StateBannerProps) {
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', toneStyles[tone], className)}>
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </div>
  )
}
