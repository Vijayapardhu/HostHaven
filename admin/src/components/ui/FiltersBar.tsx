import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface FiltersBarProps {
  children: ReactNode
  className?: string
}

export function FiltersBar({ children, className }: FiltersBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}
