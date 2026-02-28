import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, BookOpen, CalendarDays, CheckCircle, CreditCard, Heart,
  Mail, Phone, Shield, Trash2, KeyRound, MonitorSmartphone, Star,
  Clock, User2, XCircle, AlertTriangle, RefreshCw, Wrench
} from 'lucide-react'
import { usersService, type UserDetail, type UserSession } from '../lib/users'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { StateBanner } from '../components/ui/StateBanner'

type ConfirmAction = 'suspend' | 'activate' | 'delete' | 'verify' | 'resetPassword' | null

export default function UserDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [activeTab, setActiveTab] = useState<'bookings' | 'reviews' | 'services' | 'sessions'>('bookings')

  const fetchUser = async () => {
    if (!id) return
    setIsLoading(true); setError(null)
    try {
      const [userData, sessionsData] = await Promise.all([
        usersService.getUserById(id),
        usersService.getSessions(id),
      ])
      setUser(userData)
      setSessions(sessionsData)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load user details.')
    } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchUser() }, [id])

  const confirmActionHandler = async () => {
    if (!id || !confirmAction) return
    try {
      if (confirmAction === 'suspend') { await usersService.suspendUser(id); setUser(p => p ? { ...p, status: 'suspended' } : p); toast.success('User suspended.') }
      else if (confirmAction === 'activate') { await usersService.activateUser(id); setUser(p => p ? { ...p, status: 'active' } : p); toast.success('User activated.') }
      else if (confirmAction === 'delete') { await usersService.deleteUser(id); toast.success('User deleted.'); navigate('/users') }
      else if (confirmAction === 'verify') { await usersService.verifyEmail(id); setUser(p => p ? { ...p, isVerified: true } : p); toast.success('Email verified.') }
      else if (confirmAction === 'resetPassword') { const res = await usersService.resetPassword(id); toast.success(`Password reset token generated. Token: ${res.resetToken?.substring(0, 8)}…`) }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed.')
    } finally { setConfirmAction(null) }
  }

  const confirmMeta: Record<string, { title: string; desc: string; btn: string; variant: 'danger' | 'default' }> = {
    suspend: { title: 'Suspend user?', desc: 'User will lose access until reactivated.', btn: 'Suspend', variant: 'danger' },
    activate: { title: 'Reactivate user?', desc: 'User will regain access immediately.', btn: 'Activate', variant: 'default' },
    delete: { title: 'Soft-delete user?', desc: 'User will be marked as deleted and deactivated. This is recoverable.', btn: 'Delete', variant: 'danger' },
    verify: { title: 'Verify email manually?', desc: 'This will mark the user\'s email as verified by admin.', btn: 'Verify', variant: 'default' },
    resetPassword: { title: 'Reset user password?', desc: 'A password reset token will be generated. User can use it to set a new password.', btn: 'Reset', variant: 'default' },
  }

  if (isLoading) return <PageLoader rows={6} />
  if (error) return <EmptyState title="Unable to load user" description={error} action={<button type="button" onClick={fetchUser} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Retry</button>} />
  if (!user) return <EmptyState title="User not found" description="This user record does not exist." />

  const statusVariant = user.status === 'active' ? 'success' : user.status === 'deleted' ? 'danger' : 'warning'
  const statusLabel = user.status === 'active' ? 'Active' : user.status === 'deleted' ? 'Deleted' : 'Suspended'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate('/users')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <PageHeader title={user.name || 'User details'} description={`ID: ${user.id}`} actions={<StatusBadge label={statusLabel} variant={statusVariant} />} />
      </div>

      {user.isDeleted && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">This user has been soft-deleted</p>
            <p className="text-xs text-rose-600">Deleted on {user.deletedAt ? new Date(user.deletedAt).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Profile + Tabs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Card */}
          <Card>
            <CardHeader><CardTitle>Profile Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoRow icon={Mail} label="Email" value={user.email || 'Not provided'} />
                <InfoRow icon={Phone} label="Phone" value={user.phone || 'Not provided'} />
                <InfoRow icon={CalendarDays} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
                <InfoRow icon={CheckCircle} label="Verification" value={user.isVerified ? `Verified ${user.emailVerifiedAt ? `on ${new Date(user.emailVerifiedAt).toLocaleDateString()}` : ''}` : 'Pending'} valueClass={user.isVerified ? 'text-emerald-600' : 'text-amber-600'} />
                <InfoRow icon={Clock} label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} />
                <InfoRow icon={MonitorSmartphone} label="Last IP" value={user.lastLoginIp || 'N/A'} />
                <InfoRow icon={User2} label="Role" value={user.role || 'USER'} />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(['bookings', 'reviews', 'services', 'sessions'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab} {tab === 'bookings' ? `(${user._count?.bookings ?? 0})` : tab === 'reviews' ? `(${user._count?.reviews ?? 0})` : tab === 'services' ? `(${user._count?.serviceBookings ?? 0})` : `(${sessions.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'bookings' && (
            <Card>
              <CardContent className="pt-5">
                {user.bookings && user.bookings.length > 0 ? (
                  <div className="space-y-3">{user.bookings.map(b => (
                    <Link key={b.id} to={`/bookings/${b.id}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{b.property.name} <span className="text-xs text-slate-400">({b.property.type})</span></p>
                        <p className="text-xs text-slate-500">{new Date(b.checkInDate).toLocaleDateString()} – {new Date(b.checkOutDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        ₹{Number(b.totalAmount).toLocaleString()}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === 'CONFIRMED' || b.status === 'CHECKED_OUT' ? 'bg-emerald-100 text-emerald-700' : b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                      </div>
                    </Link>
                  ))}</div>
                ) : <StateBanner title="No bookings" description="User hasn't made any bookings yet." />}
              </CardContent>
            </Card>
          )}

          {activeTab === 'reviews' && (
            <Card>
              <CardContent className="pt-5">
                {user.reviews && user.reviews.length > 0 ? (
                  <div className="space-y-3">{user.reviews.map(r => (
                    <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-slate-900">{r.property.name}</p>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" /> <span className="text-sm font-bold">{r.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{r.comment}</p>
                      <p className="mt-2 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}</div>
                ) : <StateBanner title="No reviews" description="User hasn't submitted any reviews yet." />}
              </CardContent>
            </Card>
          )}

          {activeTab === 'services' && (
            <Card>
              <CardContent className="pt-5">
                {user.serviceBookings && user.serviceBookings.length > 0 ? (
                  <div className="space-y-3">{user.serviceBookings.map(sb => (
                    <Link key={sb.id} to={`/service-bookings/${sb.id}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{sb.service?.name || 'Service'}</p>
                        <p className="text-xs text-slate-500">{new Date(sb.serviceDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        {sb.totalAmount ? `₹${Number(sb.totalAmount).toLocaleString()}` : '—'}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{sb.status}</span>
                      </div>
                    </Link>
                  ))}</div>
                ) : <StateBanner title="No service bookings" description="User hasn't booked any services yet." />}
              </CardContent>
            </Card>
          )}

          {activeTab === 'sessions' && (
            <Card>
              <CardContent className="pt-5">
                {sessions.length > 0 ? (
                  <div className="space-y-3">{sessions.map(s => (
                    <div key={s.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <MonitorSmartphone className="h-4 w-4 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-900">{s.deviceType || 'Unknown device'}</p>
                          {s.isActive ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ACTIVE</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">EXPIRED</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{s.ipAddress || 'No IP'} · {s.location || 'Unknown location'}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{s.userAgent || 'No user agent'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">{new Date(s.createdAt).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">Expires: {new Date(s.expiresAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}</div>
                ) : <StateBanner title="No sessions" description="No login sessions found for this user." />}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Metrics + Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>User Metrics</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <MetricRow icon={BookOpen} label="Total Bookings" value={user._count?.bookings ?? 0} />
                <MetricRow icon={CreditCard} label="Total Spent" value={`₹${(Number(user.totalSpent) ?? 0).toLocaleString()}`} />
                <MetricRow icon={Star} label="Reviews Given" value={user._count?.reviews ?? 0} />
                <MetricRow icon={Heart} label="Wishlist Items" value={user._count?.wishlistItems ?? 0} />
                <MetricRow icon={Wrench} label="Service Bookings" value={user._count?.serviceBookings ?? 0} />
                <MetricRow icon={MonitorSmartphone} label="Login Sessions" value={sessions.length} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {!user.isVerified && (
                  <ActionBtn icon={CheckCircle} label="Verify Email" onClick={() => setConfirmAction('verify')} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" />
                )}
                <ActionBtn icon={KeyRound} label="Reset Password" onClick={() => setConfirmAction('resetPassword')} className="border-indigo-200 text-indigo-600 hover:bg-indigo-50" />
                {user.status === 'active' ? (
                  <ActionBtn icon={XCircle} label="Suspend User" onClick={() => setConfirmAction('suspend')} className="border-amber-200 text-amber-600 hover:bg-amber-50" />
                ) : user.status !== 'deleted' ? (
                  <ActionBtn icon={RefreshCw} label="Reactivate User" onClick={() => setConfirmAction('activate')} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" />
                ) : null}
                {!user.isDeleted && (
                  <ActionBtn icon={Trash2} label="Soft Delete User" onClick={() => setConfirmAction('delete')} className="border-rose-200 text-rose-600 hover:bg-rose-50" />
                )}
                <Link to={`/support?user=${user.id}`} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <Shield className="h-4 w-4" /> Create Support Ticket
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          open={Boolean(confirmAction)}
          onOpenChange={(open) => { if (!open) setConfirmAction(null) }}
          title={confirmMeta[confirmAction]?.title || ''}
          description={confirmMeta[confirmAction]?.desc || ''}
          confirmText={confirmMeta[confirmAction]?.btn || 'Confirm'}
          variant={confirmMeta[confirmAction]?.variant || 'default'}
          onConfirm={confirmActionHandler}
        />
      )}
    </div>
  )
}

/* ─── Small Components ─── */
function InfoRow({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <div className={`mt-1 flex items-center gap-2 text-sm ${valueClass || 'text-slate-700'}`}>
        <Icon className="h-4 w-4 text-slate-400" /> {value}
      </div>
    </div>
  )
}

function MetricRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-slate-600"><Icon className="h-4 w-4" /> {label}</div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, onClick, className }: { icon: any; label: string; onClick: () => void; className: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${className}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}
