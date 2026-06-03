import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, DollarSign, Users, Building2,
  Ticket, TrendingUp, ArrowRight, Eye,
  Home, Package, CreditCard, MapPin, CheckCircle
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  dashboardService, 
  type DashboardStats, 
  type RecentBooking, 
  type PendingApproval,
  type RevenueData 
} from '../lib/dashboard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const statCards = [
  { label: 'Total Users', key: 'totalUsers', icon: Users, color: 'blue', href: '/users', desc: 'Registered users' },
  { label: 'Active Vendors', key: 'totalActiveVendors', icon: Building2, color: 'orange', href: '/vendors', desc: 'Approved vendors' },
  { label: 'Properties', key: 'totalProperties', icon: Home, color: 'teal', href: '/properties', desc: 'All listings' },
  { label: 'Total Bookings', key: 'totalBookings', icon: Calendar, color: 'indigo', href: '/bookings', desc: 'All reservations' },
  { label: 'Total Revenue', key: 'totalRevenue', icon: DollarSign, color: 'green', href: '/payments', desc: 'Total earnings' },
  { label: 'Pending Approvals', key: 'pendingApprovals', icon: Ticket, color: 'amber', href: '/vendors', desc: 'Awaiting review' },
]

const moduleCards = [
  { label: 'Vendors', desc: 'Onboarding & approvals', icon: Building2, href: '/vendors', color: 'orange' },
  { label: 'Properties', desc: 'Listings & approvals', icon: Home, href: '/properties', color: 'teal' },
  { label: 'Temples', desc: 'Temple stay inventory', icon: MapPin, href: '/temples', color: 'rose' },
  { label: 'Bookings', desc: 'Manage reservations', icon: Calendar, href: '/bookings', color: 'blue' },
  { label: 'Services', desc: 'Catalog & requests', icon: Package, href: '/services', color: 'indigo' },
  { label: 'Payments', desc: 'Transactions & payouts', icon: CreditCard, href: '/payments', color: 'emerald' },
]

const defaultColors = { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', iconBg: 'bg-gray-500' }

const getColors = (color: string) => colorMap[color] || defaultColors

const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', iconBg: 'bg-blue-500' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', iconBg: 'bg-orange-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', iconBg: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', iconBg: 'bg-indigo-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', iconBg: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', iconBg: 'bg-rose-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-500' },
}

function formatValue(key: string, value: number): string {
  if (key === 'totalRevenue') {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}M`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }
  return value.toLocaleString()
}

function formatCompact(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <Skeleton className="w-12 h-12 rounded-xl mb-4" />
    <Skeleton className="w-20 h-8 rounded mb-2" />
    <Skeleton className="w-24 h-4 rounded" />
  </div>
)

const SkeletonChart = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <Skeleton className="w-32 h-6 rounded mb-4" />
    <Skeleton className="w-full h-64 rounded" />
  </div>
)

const SkeletonTable = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <Skeleton className="w-40 h-6 rounded" />
    </div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 border-b border-gray-50 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="flex-1 h-4 rounded" />
        <Skeleton className="w-20 h-4 rounded" />
      </div>
    ))}
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  const fetchDashboard = async () => {
    setIsLoading(true)
    try {
      const [statsData, bookingsData, approvalsData, revenue] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentBookings(8),
        dashboardService.getPendingApprovals(6),
        dashboardService.getRevenueData(30),
      ])
      setStats(statsData)
      setRecentBookings(bookingsData)
      setPendingApprovals(approvalsData)
      setRevenueData(revenue)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchDashboard()
  }, [])

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

  const revenueChartData = (() => {
    if (revenueData?.monthly && revenueData.monthly.length > 0) {
      return revenueData.monthly.map((item) => item)
    }
    if (revenueData?.daily && revenueData.daily.length > 0) {
      return revenueData.daily.slice(-14).map((day) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: day.revenue,
        bookings: day.bookings,
      }))
    }
    // Return empty data instead of sample data
    return []
  })()

  const bookingsByStatus = (() => {
    if (!recentBookings || recentBookings.length === 0) return []
    
    const statusCounts: Record<string, number> = {}
    recentBookings.forEach(booking => {
      const status = booking.status || 'UNKNOWN'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    })).filter(item => item.value > 0)
  })()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-24 h-10 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonTable />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <TrendingUp className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats ? (stats as any)[card.key] : 0
          const colors = getColors(card.color)
          return (
            <Link
              key={card.key}
              to={card.href}
              className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatValue(card.key, value)}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{card.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Revenue & Bookings</CardTitle>
            <span className="text-sm text-gray-500">Last 14 days</span>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `₹${formatCompact(value)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Bookings Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bookingsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {bookingsByStatus.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {moduleCards.map((card) => {
          const Icon = card.icon
          const colors = getColors(card.color)
          return (
            <Link
              key={card.label}
              to={card.href}
              className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <p className="font-medium text-gray-900 text-sm">{card.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
            </Link>
          )
        })}
      </div>

      {/* Recent Bookings & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
            <Link to="/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentBookings.slice(0, 6).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                        {(booking.userName || 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{booking.propertyName}</p>
                        <p className="text-xs text-gray-500">{booking.userName || 'Guest'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{booking.amount.toLocaleString()}</p>
                      <StatusBadge label={booking.status} variant={getStatusVariant(booking.status)} className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No bookings yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
            <span className="text-sm text-gray-500">{pendingApprovals.length} pending</span>
          </CardHeader>
          <CardContent className="p-0">
            {pendingApprovals.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {pendingApprovals.slice(0, 6).map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        approval.type === 'vendor' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'
                      }`}>
                        {approval.type === 'vendor' ? <Building2 className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{approval.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{approval.type} approval</p>
                      </div>
                    </div>
                    <Link
                      to={approval.type === 'vendor' ? `/vendors/${approval.id}` : `/properties/${approval.slug}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No pending approvals</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
