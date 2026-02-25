import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Building2, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'
import { analyticsService, type AnalyticsData } from '../lib/analytics'
import { PageHeader } from '../components/ui/PageHeader'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m'>('30d')

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await analyticsService.getAnalytics(timeRange)
      setData(result)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load analytics.')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const stats = useMemo(() => {
    if (!data) return []
    return [
      {
        name: 'Total Users',
        value: data.totalUsers.toLocaleString(),
        growth: data.userGrowth,
        icon: Users,
        color: 'bg-blue-500',
      },
      {
        name: 'Total Properties',
        value: data.totalProperties.toLocaleString(),
        growth: data.propertyGrowth,
        icon: Building2,
        color: 'bg-emerald-500',
      },
      {
        name: 'Total Bookings',
        value: data.totalBookings.toLocaleString(),
        growth: data.bookingGrowth,
        icon: Calendar,
        color: 'bg-amber-500',
      },
      {
        name: 'Total Revenue',
        value: `₹${data.totalRevenue.toLocaleString()}`,
        growth: data.revenueGrowth,
        icon: DollarSign,
        color: 'bg-purple-500',
      },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track platform performance across bookings and revenue."
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="h-4 w-4" />
            Updated based on selected time range.
          </div>
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value as '7d' | '30d' | '3m')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load analytics"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchAnalytics}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : !data ? (
        <EmptyState
          title="No analytics data"
          description="Analytics will appear once bookings and revenue are recorded."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              const isPositive = stat.growth >= 0
              return (
                <Card key={stat.name}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.name}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                      <div className={`mt-1 flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {Math.abs(stat.growth)}%
                      </div>
                    </div>
                    <div className={`${stat.color} rounded-xl p-3 text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bookings trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end justify-between gap-2">
                  {data.bookingsByMonth.map((item) => (
                    <div key={item.month} className="flex-1">
                      <div
                        className="w-full rounded-t-lg bg-slate-900"
                        style={{
                          height: `${Math.max(
                            8,
                            (item.count / Math.max(...data.bookingsByMonth.map((b) => b.count), 1)) * 100
                          )}%`,
                        }}
                      />
                      <p className="mt-2 text-center text-xs text-slate-500">{item.month}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end justify-between gap-2">
                  {data.revenueByMonth.map((item) => (
                    <div key={item.month} className="flex-1">
                      <div
                        className="w-full rounded-t-lg bg-emerald-500"
                        style={{
                          height: `${Math.max(
                            8,
                            (item.amount / Math.max(...data.revenueByMonth.map((r) => r.amount), 1)) * 100
                          )}%`,
                        }}
                      />
                      <p className="mt-2 text-center text-xs text-slate-500">{item.month}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top performing properties</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProperties.map((property, index) => (
                    <TableRow key={`${property.name}-${index}`}>
                      <TableCell>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">{property.name}</TableCell>
                      <TableCell>{property.bookings}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">₹{property.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
