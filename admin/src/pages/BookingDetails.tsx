import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CalendarDays, Phone, Mail } from 'lucide-react'
import { bookingsService, type Booking } from '../lib/bookings'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  const fetchBooking = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await bookingsService.getBookingById(id)
      setBooking(data)
      try {
        const payment = await bookingsService.getPaymentDetails(id)
        setPaymentDetails(payment)
      } catch (e) {
        // Payment might not exist
        console.warn('No payment found', e)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load booking details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  const statusLabel = useMemo(() => {
    if (!booking) return ''
    if (booking.status === 'confirmed') return 'Confirmed'
    if (booking.status === 'pending') return 'Pending'
    if (booking.status === 'checked_in') return 'Checked-in'
    if (booking.status === 'checked_out') return 'Checked-out'
    return 'Cancelled'
  }, [booking])

  const statusVariant = useMemo(() => {
    if (!booking) return 'neutral' as const
    if (booking.status === 'confirmed') return 'success' as const
    if (booking.status === 'pending') return 'warning' as const
    if (booking.status === 'checked_in') return 'info' as const
    if (booking.status === 'checked_out') return 'neutral' as const
    return 'danger' as const
  }, [booking])

  const handleStatusChange = async (newStatus: BookingStatus, reason?: string) => {
    if (!booking) return
    setIsChangingStatus(true)
    try {
      await bookingsService.updateBookingStatus(booking.id, newStatus.toUpperCase(), reason)
      setBooking({ ...booking, status: newStatus, ...(reason ? { cancellationReason: reason } : {}) })
      toast.success(`Booking status successfully updated to ${newStatus}.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update booking status.')
    } finally {
      setIsChangingStatus(false)
      setConfirmCancel(false) // in case the change was a cancellation
    }
  }

  const handleRefund = async () => {
    if (!booking) return
    try {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined
      if (!refundReason.trim() || refundReason.trim().length < 5) {
        toast.error('Please provide a refund reason of at least 5 characters.')
        return
      }
      await bookingsService.processRefund(booking.id, amount, refundReason.trim())
      setBooking({
        ...booking,
        paymentStatus: 'refunded',
        status: 'refunded',
        amountRefunded: amount ?? booking.amountPaid ?? booking.totalAmount,
        cancellationNotes: refundReason.trim(),
      })
      toast.success('Refund processed successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to process refund.')
    } finally {
      setConfirmRefund(false)
      setRefundReason('')
      setRefundAmount('')
    }
  }

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load booking"
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
    return <EmptyState title="Booking not found" description="This booking record does not exist." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/bookings')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={`Booking #${booking.bookingNumber || booking.id}`}
          description={`Created ${new Date(booking.createdAt).toLocaleDateString()}`}
          actions={<StatusBadge label={statusLabel} variant={statusVariant} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Stay details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Property</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{booking.property?.name}</p>
                  <p className="text-xs text-slate-500">{booking.property?.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Dates</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {new Date(booking.checkInDate).toLocaleDateString()} -{' '}
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Rooms booked</p>
                  <p className="mt-1 text-sm text-slate-700">{booking.roomsBooked ?? 1}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Special requests</p>
                  <p className="mt-1 text-sm text-slate-700">{booking.specialRequests || 'None'}</p>
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
                  <span className="text-slate-500">Paid amount</span>
                  <span className="font-semibold text-slate-900">₹{(booking.amountPaid ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Refunded</span>
                  <span className="font-semibold text-slate-900">₹{(booking.amountRefunded ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment status</span>
                  <StatusBadge label={booking.paymentStatus} variant={booking.paymentStatus === 'completed' ? 'success' : booking.paymentStatus === 'refunded' ? 'neutral' : 'warning'} />
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
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{booking.user?.name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{booking.user?.phone || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/users/${booking.userId}`)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View user profile
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.status !== 'cancelled' && booking.status !== 'checked_out' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    disabled={isChangingStatus}
                    className="w-full rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Cancel booking
                  </button>
                ) : null}
                {booking.status === 'checked_in' || booking.status === 'confirmed' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('checked_out')}
                    disabled={isChangingStatus}
                    className="w-full rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Mark as completed
                  </button>
                ) : null}
                {booking.paymentStatus === 'completed' && booking.status !== 'cancelled' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRefundReason('')
                      setRefundAmount(String(booking.amountPaid ?? booking.totalAmount ?? ''))
                      setConfirmRefund(true)
                    }}
                    className="w-full rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50"
                  >
                    Issue refund
                  </button>
                ) : null}

                <div className="pt-4 border-t border-slate-100 mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Override Status</p>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    value={booking.status}
                    onChange={(e) => handleStatusChange(e.target.value as BookingStatus)}
                    disabled={isChangingStatus}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/properties/${booking.property?.slug}`)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View property
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {paymentDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex flex-col gap-1 break-all">
                    <span className="font-semibold text-slate-500">Order ID:</span>
                    <span className="text-slate-800 font-mono bg-slate-50 p-1 rounded">{paymentDetails.razorpayOrderId || '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1 break-all">
                    <span className="font-semibold text-slate-500">Payment ID:</span>
                    <span className="text-slate-800 font-mono bg-slate-50 p-1 rounded">{paymentDetails.razorpayPaymentId || '—'}</span>
                  </div>
                  {(paymentDetails.errorCode || paymentDetails.errorDesc) && (
                    <div className="mt-2 p-2 bg-rose-50 rounded-lg text-rose-700 border border-rose-100">
                      <p className="font-semibold">Error: {paymentDetails.errorCode}</p>
                      <p className="mt-1">{paymentDetails.errorDesc}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this booking?"
        description="The booking will be cancelled and the guest will be notified."
        confirmText="Cancel booking"
        variant="danger"
        onConfirm={() => handleStatusChange('cancelled', cancelReason.trim() || undefined)}
      >
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-slate-700">Cancellation Reason</label>
          <textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Explain why this booking is being cancelled"
            rows={3}
            className="w-full rounded-lg border border-slate-200 p-3 text-sm"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmRefund}
        onOpenChange={setConfirmRefund}
        title="Process refund?"
        description="The refund will be issued via Razorpay and the booking will be cancelled."
        confirmText="Process refund"
        variant="danger"
        onConfirm={handleRefund}
      >
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Refund Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Refund Reason</label>
            <textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Describe why this refund is being issued"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
