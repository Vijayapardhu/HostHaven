import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, DollarSign, Users, Building2, Truck, 
  Ticket, TrendingUp, ArrowRight,
  CheckCircle, AlertCircle,
  CreditCard, MapPin, Home, Package, Bell, Settings, Boxes, LifeBuoy
} from 'lucide-react'
import { dashboardService, type DashboardStats, type RecentBooking, type PendingApproval } from '../lib/dashboard'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'

const statCards = [
  { label: 'Total Bookings', key: 'totalBookings', icon: Calendar, color: 'blue', href: '/bookings' },
  { label: 'Total Revenue', key: 'totalRevenue', icon: DollarSign, color: 'green', href: '/payments' },
  { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'purple', href: '/users' },
  { label: 'Active Vendors', key: 'totalActiveVendors', icon: Building2, color: 'orange', href: '/vendors' },
  { label: 'Properties', key: 'totalProperties', icon: Home, color: 'teal', href: '/properties' },
  { label: 'Service Bookings', key: 'totalServiceBookings', icon: Truck, color: 'indigo', href: '/service-bookings' },
  { label: 'Support Tickets', key: 'totalSupportTickets', icon: Ticket, color: 'pink', href: '/support' },
  { label: 'Open Tickets', key: 'openTickets', icon: AlertCircle, color: 'red', href: '/support' },
]

const moduleCards = [
  { label: 'Vendors', desc: 'Onboarding and approvals', icon: Building2, href: '/vendors', color: 'text-orange-600' },
  { label: 'Properties', desc: 'Listings and approvals', icon: Home, href: '/properties', color: 'text-teal-600' },
  { label: 'Temples', desc: 'Temple stay inventory', icon: MapPin, href: '/temples', color: 'text-rose-600' },
  { label: 'Bookings', desc: 'Manage reservations', icon: Calendar, href: '/bookings', color: 'text-blue-600' },
  { label: 'Services', desc: 'Catalog and requests', icon: Package, href: '/services', color: 'text-indigo-600' },
  { label: 'Inventory', desc: 'Availability controls', icon: Boxes, href: '/inventory', color: 'text-amber-600' },
  { label: 'Payments', desc: 'Transactions and payouts', icon: CreditCard, href: '/payments', color: 'text-emerald-600' },
  { label: 'Users', desc: 'Accounts and access', icon: Users, href: '/users', color: 'text-purple-600' },
  { label: 'Notifications', desc: 'Delivery and campaigns', icon: Bell, href: '/notifications', color: 'text-pink-600' },
  { label: 'Support', desc: 'Tickets and resolutions', icon: LifeBuoy, href: '/support', color: 'text-cyan-600' },
  { label: 'Analytics', desc: 'Reports and trends', icon: TrendingUp, href: '/analytics', color: 'text-sky-600' },
  { label: 'Settings', desc: 'System configuration', icon: Settings, href: '/settings', color: 'text-slate-600' },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  teal: 'bg-teal-50 text-teal-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  pink: 'bg-pink-50 text-pink-600',
  red: 'bg-red-50 text-red-600',
}

function formatValue(key: string, value: number): string {
  if (key === 'totalRevenue') {
    return `₹${value >= 10000000 ? `${(value / 10000000).toFixed(1)}M` : value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value.toLocaleString()}`
  }
  return value.toLocaleString()
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboard = async () => {
    setIsLoading(true)
    try {
      const [statsData, bookingsData, approvalsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentBookings(8),
        dashboardService.getPendingApprovals(6),
      ])
      setStats(statsData)
      setRecentBookings(bookingsData)
      setPendingApprovals(approvalsData)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (isLoading) {
    return <PageLoader rows={10} />
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success'
      case 'PENDING': return 'warning'
      case 'CANCELLED': return 'danger'
      case 'CHECKED_IN': return 'info'
      case 'CHECKED_OUT': return 'neutral'
      default: return 'neutral'
    }
  }

  const getApprovalVariant = (type: string) => {
    return type === 'vendor' ? 'info' : 'warning'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats ? (stats as any)[card.key] : 0
          return (
            <Link
              key={card.key}
              to={card.href}
              className="group bg-white rounded-2xl p-4 border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl ${colorMap[card.color]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{formatValue(card.key, value)}</p>
              <p className="text-xs text-neutral-500 mt-1">{card.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Recent Bookings</h2>
            <Link to="/bookings" className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-50">
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">No bookings yet</div>
            ) : (
              recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/bookings/${booking.id}`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{booking.propertyName}</p>
                      <p className="text-sm text-neutral-500">{booking.userName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">₹{booking.amount.toLocaleString()}</p>
                    <StatusBadge label={booking.status} variant={getStatusVariant(booking.status) as any} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Pending Approvals</h2>
            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
              {pendingApprovals.length}
            </span>
          </div>
          <div className="divide-y divide-neutral-50">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                <p>All caught up!</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <Link
                  key={`${approval.type}-${approval.id}`}
                  to={approval.type === 'vendor' ? `/vendors/${approval.id}` : `/properties/${approval.id}`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${approval.type === 'vendor' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                      {approval.type === 'vendor' ? <Building2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{approval.name}</p>
                      <p className="text-xs text-neutral-500">{approval.submittedBy || approval.description}</p>
                    </div>
                  </div>
                  <StatusBadge label={approval.type} variant={getApprovalVariant(approval.type) as any} />
                </Link>
              ))
            )}
          </div>
          {pendingApprovals.length > 0 && (
            <div className="p-4 border-t border-neutral-100">
              <Link
                to="/vendors/approval"
                className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-colors"
              >
                View all approvals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Module Hub */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Admin Modules</h2>
          <span className="text-xs text-neutral-500">Aligned with enterprise panel structure</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {moduleCards.map((module) => (
            <Link
              key={module.label}
              to={module.href}
              className="bg-white rounded-xl p-4 border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all group"
            >
              <module.icon className={`w-6 h-6 mb-2 group-hover:scale-110 transition-transform ${module.color}`} />
              <p className="font-medium text-neutral-900">{module.label}</p>
              <p className="text-xs text-neutral-500">{module.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-emerald-100 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
          <p className="text-emerald-200 text-sm mt-2">Across all bookings</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-blue-100 text-sm">Total Bookings</p>
          <p className="text-3xl font-bold mt-1">{(stats?.totalBookings ?? 0).toLocaleString()}</p>
          <p className="text-blue-200 text-sm mt-2">{stats?.newBookingsToday ?? 0} new today</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-purple-100 text-sm">Total Users</p>
          <p className="text-3xl font-bold mt-1">{(stats?.totalUsers ?? 0).toLocaleString()}</p>
          <p className="text-purple-200 text-sm mt-2">Registered users</p>
        </div>
      </div>
    </div>
  )
}
