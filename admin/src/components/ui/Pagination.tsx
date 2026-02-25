import { cn } from '../../lib/utils'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canGoBack = page > 1
  const canGoNext = page < totalPages

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-sm text-slate-600">
        Showing <span className="font-medium text-slate-900">{start}</span> to{' '}
        <span className="font-medium text-slate-900">{end}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span> results
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        ) : null}
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoBack}
            className={cn(
              'rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium',
              canGoBack
                ? 'bg-white text-slate-700 hover:bg-slate-50'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            )}
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page <span className="font-medium text-slate-900">{page}</span> of{' '}
            <span className="font-medium text-slate-900">{totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            className={cn(
              'rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium',
              canGoNext
                ? 'bg-white text-slate-700 hover:bg-slate-50'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
