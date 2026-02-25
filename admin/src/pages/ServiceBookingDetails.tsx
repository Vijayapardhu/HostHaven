import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CalendarDays, Clock, Phone } from 'lucide-react'
import { serviceBookingsService, type ServiceBooking } from '../lib/serviceBookings'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

type ServiceBookingStatus = 'ADVANCE_PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

const statusLabels: Record<ServiceBookingStatus, string> = {
  ADVANCE_PAID: 'Advance paid',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const statusVariants: Record<ServiceBookingStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  ADVANCE_PAID: 'warning',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

export default function ServiceBookingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<ServiceBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmAccept, setConfirmAccept] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmRefund, setConfirmRefund] = useState(false)

  const fetchBooking = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await serviceBookingsService.getServiceBookingById(id)
      setBooking(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load service booking details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  const statusLabel = useMemo(() => {
    if (!booking) return ''
    return statusLabels[booking.status]
  }, [booking])

  const statusVariant = useMemo(() => {
    if (!booking) return 'neutral' as const
    return statusVariants[booking.status]
  }, [booking])

  const handleAccept = async () => {
    if (!booking) return
    try {
      await serviceBookingsService.acceptServiceBooking(booking.id)
      setBooking({ ...booking, status: 'CONFIRMED' })
      toast.success('Service booking accepted.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to accept service booking.')
    } finally {
      setConfirmAccept(false)
    }
  }

  const handleReject = async () => {
    if (!booking) return
    try {
      await serviceBookingsService.rejectServiceBooking(booking.id, 'Rejected by admin')
      setBooking({ ...booking, status: 'CANCELLED' })
      toast.success('Service booking rejected.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to reject service booking.')
    } finally {
      setConfirmReject(false)
    }
  }

  const handleCancel = async () => {
    if (!booking) return
    try {
      await serviceBookingsService.cancelServiceBooking(booking.id, 'Cancelled by admin')
      setBooking({ ...booking, status: 'CANCELLED' })
      toast.success('Service booking cancelled.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to cancel service booking.')
    } finally {
      setConfirmCancel(false)
    }
  }

  const handleComplete = async () => {
    if (!booking) return
    try {
      await serviceBookingsService.completeServiceBooking(booking.id)
      setBooking({ ...booking, status: 'COMPLETED' })
      toast.success('Service booking marked as completed.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update service booking.')
    } finally {
      setConfirmComplete(false)
    }
  }

  const handleRefund = async () => {
    if (!booking) return
    try {
      const refundAmount = booking.advanceAmount ?? booking.totalAmount
      await serviceBookingsService.processServiceRefund(booking.id, refundAmount, 'Refund issued by admin')
      setBooking({ ...booking, paymentStatus: 'REFUNDED', status: 'CANCELLED' })
      toast.success('Refund processed successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to process refund.')
    } finally {
      setConfirmRefund(false)
    }
  }

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load service booking"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchBooking}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  if (!booking) {
    return <EmptyState title="Service booking not found" description="This booking record does not exist." />
  }

  const canAccept = booking.status === 'ADVANCE_PAID'
  const canReject = booking.status === 'ADVANCE_PAID'
  const canComplete = booking.status === 'CONFIRMED'
  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'ADVANCE_PAID'
  const canRefund = booking.paymentStatus === 'COMPLETED' && booking.status !== 'CANCELLED'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/service-bookings')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={`Service Booking #${booking.serviceBookingNumber || booking.bookingNumber || booking.id}`}
          description={`Created ${new Date(booking.createdAt).toLocaleDateString()}`}
          actions={<StatusBadge label={statusLabel} variant={statusVariant} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Service</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{booking.serviceName || booking.service?.name || 'Service'}</p>
                  <p className="text-xs text-slate-500">Category: {booking.serviceCategory || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Schedule</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {booking.serviceDate ? new Date(booking.serviceDate).toLocaleDateString() : '—'}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {booking.serviceTime || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{booking.notes || 'No notes provided.'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Description</p>
                  <p className="mt-1 text-sm text-slate-700">{booking.location || 'No location provided.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total amount</span>
                  <span className="font-semibold text-slate-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Advance amount</span>
                  <span className="font-semibold text-slate-900">₹{(booking.advanceAmount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment status</span>
                  <StatusBadge
                    label={booking.paymentStatus ? booking.paymentStatus.toLowerCase() : 'pending'}
                    variant={
                      booking.paymentStatus === 'COMPLETED'
                        ? 'success'
                        : booking.paymentStatus === 'REFUNDED'
                        ? 'neutral'
                        : 'warning'
                    }
                    className="capitalize"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{booking.user?.name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{booking.user?.phone || '—'}</span>
                </div>
                {booking.userId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/users/${booking.userId}`)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View user profile
                  </button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {canAccept ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAccept(true)}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Accept booking
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReject(true)}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Reject booking
                  </button>
                ) : null}
                {canComplete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmComplete(true)}
                    className="w-full rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Mark as completed
                  </button>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Cancel booking
                  </button>
                ) : null}
                {canRefund ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRefund(true)}
                    className="w-full rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Process refund
                  </button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAccept}
        onOpenChange={setConfirmAccept}
        title="Accept this booking?"
        description="The booking will be marked as accepted."
        confirmText="Accept booking"
        onConfirm={handleAccept}
      />

      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        title="Reject this booking?"
        description="The booking will be marked as rejected."
        confirmText="Reject booking"
        variant="danger"
        onConfirm={handleReject}
      />

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Mark as completed?"
        description="The booking will be marked as completed."
        confirmText="Mark completed"
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this booking?"
        description="The booking will be cancelled and the guest will be notified."
        confirmText="Cancel booking"
        variant="danger"
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={confirmRefund}
        onOpenChange={setConfirmRefund}
        title="Process refund?"
        description="The refund will be issued and the booking will be cancelled."
        confirmText="Process refund"
        variant="danger"
        onConfirm={handleRefund}
      />
    </div>
  )
}
