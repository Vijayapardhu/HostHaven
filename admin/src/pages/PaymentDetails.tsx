import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, IndianRupee, Receipt, User } from 'lucide-react'
import { paymentsService, type Payment } from '../lib/payments'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const statusVariant = (status: Payment['status']) => {
  if (status === 'completed') return 'success'
  if (status === 'pending' || status === 'processing') return 'warning'
  if (status === 'refunded' || status === 'partially_refunded') return 'neutral'
  return 'danger'
}

export default function PaymentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const loadPayment = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getPaymentById(id)
      setPayment(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payment details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPayment()
  }, [id])

  const handleRefund = async () => {
    if (!payment) return
    const amount = Number(refundAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid refund amount')
      return
    }
    if (amount > (payment.refundableBalance ?? payment.amount)) {
      toast.error('Refund amount cannot exceed the remaining refundable balance')
      return
    }
    if (!refundReason.trim() || refundReason.trim().length < 5) {
      toast.error('Refund reason must be at least 5 characters')
      return
    }
    try {
      await paymentsService.refundPayment(payment.id, amount, refundReason.trim())
      await loadPayment()
      toast.success('Refund processed successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to process refund.')
    } finally {
      setConfirmRefund(false)
      setRefundAmount('')
      setRefundReason('')
    }
  }

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load payment"
        description={error}
        action={
          <button
            type="button"
            onClick={loadPayment}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  if (!payment) {
    return (
      <EmptyState
        title="Payment not found"
        description="The requested payment record is not available."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/payments')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title="Payment details"
          description={`Transaction ${payment.transactionId}`}
          actions={
            <StatusBadge
              label={payment.status}
              variant={statusVariant(payment.status)}
              className="capitalize"
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Transaction ID</p>
                  <p className="font-semibold text-slate-900">{payment.transactionId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Method</p>
                    <p className="font-semibold text-slate-900 uppercase">{payment.method || '—'}</p>
                </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Amount</p>
                <p className="font-semibold text-slate-900">
                  ₹{payment.amount.toLocaleString()} {payment.currency}
                </p>
                {typeof payment.refundableBalance === 'number' ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Remaining refundable balance: ₹{payment.refundableBalance.toLocaleString()}
                  </p>
                ) : null}
              </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Created</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Razorpay Payment ID</p>
                  <p className="font-semibold text-slate-900">
                    {payment.razorpayPaymentId || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Razorpay Order ID</p>
                  <p className="font-semibold text-slate-900">
                    {payment.razorpayOrderId || '—'}
                  </p>
                </div>
              </div>

              {(payment.errorCode || payment.errorDesc) ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs font-semibold text-rose-700">Failure details</p>
                  <p className="mt-1 text-sm text-rose-700">
                    {payment.errorDesc || payment.errorCode}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-slate-500" />
                Booking & Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs font-medium text-slate-500">Booking</p>
                {payment.bookingId ? (
                  <Link
                    to={`/bookings/${payment.bookingId}`}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    {payment.bookingNumber || payment.bookingId}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-900">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Property</p>
                <p className="font-semibold text-slate-900">{payment.propertyName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Customer</p>
                <p className="font-semibold text-slate-900">
                  {payment.user?.name || payment.user?.email || payment.user?.phone || '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-slate-500" />
                Refund Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.refunds && payment.refunds.length > 0 ? (
                payment.refunds.map((refund) => (
                  <div key={refund.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-medium text-slate-500">Refund ID</p>
                    <p className="text-sm font-semibold text-slate-900">{refund.id}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      ₹{refund.amount.toLocaleString()} • {refund.status}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(refund.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No refunds recorded for this payment.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payment.bookingId ? (
                <Link
                  to={`/bookings/${payment.bookingId}`}
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View booking
                </Link>
              ) : null}
              <Link
                to="/payments"
                className="block rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to payments
              </Link>
              {(payment.status === 'completed' || payment.status === 'partially_refunded') && (payment.refundableBalance ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setRefundAmount(String(payment.refundableBalance ?? payment.amount))
                    setRefundReason('')
                    setConfirmRefund(true)
                  }}
                  className="block w-full rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Refund this payment
                </button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRefund}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRefund(false)
            setRefundAmount('')
            setRefundReason('')
          }
        }}
        title="Process refund?"
        description="Enter the exact refund amount and a clear business reason. This action is audited."
        confirmText="Process refund"
        variant="danger"
        onConfirm={handleRefund}
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Refund Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Describe why this refund is being issued"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
