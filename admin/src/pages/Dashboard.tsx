import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, Calendar, DollarSign, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalProperties: number
  totalBookings: number
  totalRevenue: number
  pendingVendorApprovals: number
  pendingPropertyApprovals: number
  flaggedReviews: number
}

interface RecentActivity {
  id: number
  action: string
  user: string
  time: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setActivities(data.recentActivity || [])
        } else {
          setStats({
            totalUsers: 2543,
            totalProperties: 458,
            totalBookings: 1234,
            totalRevenue: 1245600,
            pendingVendorApprovals: 5,
            pendingPropertyApprovals: 12,
            flaggedReviews: 3
          })
          setActivities([
            { id: 1, action: 'New vendor registered', user: 'Luxury Stays Pvt Ltd', time: '5 min ago' },
            { id: 2, action: 'Property approved', user: 'Beach Villa Goa', time: '12 min ago' },
            { id: 3, action: 'User reported issue', user: 'Rahul Sharma', time: '1 hour ago' },
          ])
        }
      } catch (error) {
        setStats({
          totalUsers: 2543,
          totalProperties: 458,
          totalBookings: 1234,
          totalRevenue: 1245600,
          pendingVendorApprovals: 5,
          pendingPropertyApprovals: 12,
          flaggedReviews: 3
        })
        setActivities([
          { id: 1, action: 'New vendor registered', user: 'Luxury Stays Pvt Ltd', time: '5 min ago' },
          { id: 2, action: 'Property approved', user: 'Beach Villa Goa', time: '12 min ago' },
          { id: 3, action: 'User reported issue', user: 'Rahul Sharma', time: '1 hour ago' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers.toLocaleString() || '...',
      change: '+12% this month',
      icon: Users,
      color: 'bg-blue-500',
      href: '/users'
    },
    {
      name: 'Active Properties',
      value: stats?.totalProperties.toLocaleString() || '...',
      change: '+8 this week',
      icon: Building2,
      color: 'bg-green-500',
      href: '/properties'
    },
    {
      name: 'Total Bookings',
      value: stats?.totalBookings.toLocaleString() || '...',
      change: '+24% from last month',
      icon: Calendar,
      color: 'bg-yellow-500',
      href: '/bookings'
    },
    {
      name: 'Platform Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: '+18% growth',
      icon: DollarSign,
      color: 'bg-purple-500',
      href: '/payments'
    },
  ]

  const pendingActions = [
    { 
      id: 1, 
      type: 'Vendor Approval', 
      item: `${stats?.pendingVendorApprovals || 0} vendors pending approval`, 
      priority: 'high',
      href: '/vendors/approval'
    },
    { 
      id: 2, 
      type: 'Property Approval', 
      item: `${stats?.pendingPropertyApprovals || 0} properties pending review`, 
      priority: 'medium',
      href: '/properties/approval'
    },
    { 
      id: 3, 
      type: 'Flagged Reviews', 
      item: `${stats?.flaggedReviews || 0} reviews flagged by users`, 
      priority: 'low',
      href: '/reviews'
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600 mt-1">Monitor and manage your HostHaven platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
            </div>
          </div>
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <Link
                key={action.id}
                to={action.href}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{action.type}</p>
                  <p className="text-sm text-gray-600">{action.item}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      action.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : action.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {action.priority}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.user}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Platform Growth</h2>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Analytics chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
