import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle, CreditCard, Heart, Mail, Phone } from 'lucide-react'
import { usersService, type User } from '../lib/users'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { StateBanner } from '../components/ui/StateBanner'

type UserStatus = 'active' | 'suspended'

interface UserDetail extends User {
  lastLoginAt?: string
  totalSpent?: number
  wishlistCount?: number
  bookingHistory?: Array<{
    id: string
    propertyName: string
    checkIn: string
    checkOut: string
    status: string
    amount: number
  }>
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<UserStatus | null>(null)

  const fetchUser = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await usersService.getUserById(id)
      setUser(data as UserDetail)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load user details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  const handleStatusChange = (nextStatus: UserStatus) => {
    setConfirmAction(nextStatus)
  }

  const confirmStatusChange = async () => {
    if (!id || !confirmAction) return
    try {
      if (confirmAction === 'suspended') {
        await usersService.suspendUser(id)
      } else {
        await usersService.activateUser(id)
      }
      setUser((prev) => (prev ? { ...prev, status: confirmAction } : prev))
      toast.success(`User ${confirmAction === 'suspended' ? 'suspended' : 'activated'} successfully.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update user status.')
    } finally {
      setConfirmAction(null)
    }
  }

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load user"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchUser}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  if (!user) {
    return <EmptyState title="User not found" description="This user record does not exist." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={user.name || 'User details'}
          description={`User ID: ${user.id}`}
          actions={
            <StatusBadge
              label={user.status === 'active' ? 'Active' : 'Suspended'}
              variant={user.status === 'active' ? 'success' : 'danger'}
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {user.email || 'Not provided'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Phone</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user.phone}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Joined</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Verification</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking history</CardTitle>
            </CardHeader>
            <CardContent>
              {user.bookingHistory && user.bookingHistory.length > 0 ? (
                <div className="space-y-3">
                  {user.bookingHistory.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{booking.propertyName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-slate-700">
                        ₹{booking.amount.toLocaleString()}
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBanner title="No booking history" description="Bookings will appear once the user completes them." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen className="h-4 w-4" />
                    Total bookings
                  </div>
                  <span className="font-semibold text-slate-900">{user.bookingsCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CreditCard className="h-4 w-4" />
                    Total spent
                  </div>
                  <span className="font-semibold text-slate-900">₹{(user.totalSpent ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Heart className="h-4 w-4" />
                    Wishlist items
                  </div>
                  <span className="font-semibold text-slate-900">{user.wishlistCount ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('suspended')}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Suspend user
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('active')}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    Reactivate user
                  </button>
                )}
                <Link
                  to={`/support?user=${user.id}`}
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Create support ticket
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={confirmAction === 'suspended' ? 'Suspend this user?' : 'Reactivate this user?'}
        description={
          confirmAction === 'suspended'
            ? 'The user will lose access until reactivated.'
            : 'The user will regain access immediately.'
        }
        confirmText={confirmAction === 'suspended' ? 'Suspend user' : 'Reactivate user'}
        variant={confirmAction === 'suspended' ? 'danger' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
