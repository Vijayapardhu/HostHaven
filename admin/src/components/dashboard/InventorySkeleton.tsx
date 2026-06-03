import { Card, CardContent, CardHeader } from '../ui/Card'

export function InventorySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="mt-1 h-4 w-1/2 rounded bg-slate-200" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-4 w-10 rounded bg-slate-200" />
            </div>
            <div className="h-2 w-full rounded bg-slate-200" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-lg bg-slate-50 py-2">
                  <div className="mx-auto h-6 w-8 rounded bg-slate-200" />
                  <div className="mt-1 mx-auto h-3 w-10 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
