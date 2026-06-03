interface OccupancyBarProps {
  filled: number
  locked: number
  total: number
  className?: string
}

export function OccupancyBar({ filled, locked, total, className }: OccupancyBarProps) {
  const filledPercent = total > 0 ? (filled / total) * 100 : 0
  const lockedPercent = total > 0 ? (locked / total) * 100 : 0

  return (
    <div className={className}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {filledPercent > 0 && (
          <div
            className="bg-rose-500 transition-all duration-500 ease-out"
            style={{ width: `${filledPercent}%` }}
          />
        )}
        {lockedPercent > 0 && (
          <div
            className="bg-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${lockedPercent}%` }}
          />
        )}
        {total - filled - locked > 0 && (
          <div
            className="flex-1 bg-emerald-500 transition-all duration-500 ease-out"
          />
        )}
      </div>
    </div>
  )
}
