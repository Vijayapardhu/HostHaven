import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { dashboardService, type DashboardStats, type PendingApproval, type RecentBooking } from '../lib/dashboard'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsData, recentData, pendingData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentBookings(5),
        dashboardService.getPendingApprovals(6),
      ])
      setStats(statsData)
      setRecentBookings(recentData)
      setPendingApprovals(pendingData)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load dashboard data.')
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchDashboard}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Monitor bookings, revenue, vendors, and approvals."
        actions={
          <button
            type="button"
            onClick={fetchDashboard}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Total bookings</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalBookings ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Total revenue</p>
            <p className="text-2xl font-bold text-slate-900">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Active vendors</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalActiveVendors ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Pending approvals</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.pendingApprovals ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <EmptyState title="No recent bookings" description="Bookings will appear here." />
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{booking.propertyName}</p>
                      <p className="text-xs text-slate-500">{booking.userName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">₹{booking.amount.toLocaleString()}</p>
                      <StatusBadge label={booking.status} variant={booking.status === 'confirmed' ? 'success' : 'warning'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <EmptyState title="No pending approvals" description="All caught up." />
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{new Date(item.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge label={item.type} variant={item.type === 'vendor' ? 'info' : 'warning'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
