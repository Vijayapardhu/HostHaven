import { Skeleton } from './Skeleton'

interface PageLoaderProps {
  rows?: number
}

export function PageLoader({ rows = 5 }: PageLoaderProps) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
