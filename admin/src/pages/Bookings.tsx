import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { RefreshCw, Download, DollarSign } from 'lucide-react'
import { bookingsService, type Booking } from '../lib/bookings'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { downloadCsvExport } from '../lib/export'
import { getUserFriendlyError } from '../lib/errorUtils'

type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'refunded'
type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed'

const statusOptions: Array<{ label: string; value: 'all' | BookingStatus }> = [
  { label: 'All status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Checked-in', value: 'checked_in' },
  { label: 'Checked-out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
]

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked-in',
  checked_out: 'Checked-out',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const statusVariants: Record<BookingStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  pending: 'warning',
  confirmed: 'success',
  checked_in: 'info',
  checked_out: 'neutral',
  cancelled: 'danger',
  refunded: 'neutral',
}

const paymentVariants: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  completed: 'success',
  pending: 'warning',
  refunded: 'neutral',
  failed: 'danger',
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmRefund, setConfirmRefund] = useState<{ bookingId: string; amount?: number; maxAmount?: number } | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const fetchBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await bookingsService.getBookings({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setBookings(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load bookings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, pageSize, searchTerm, statusFilter])

  const confirmRefundAction = async () => {
    if (!confirmRefund) return
    try {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined
      if (!refundReason.trim() || refundReason.trim().length < 5) {
        toast.error('Please provide a refund reason of at least 5 characters.')
        return
      }
      await bookingsService.processRefund(confirmRefund.bookingId, amount, refundReason.trim())
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === confirmRefund.bookingId
            ? { ...booking, paymentStatus: 'refunded', status: 'refunded', amountRefunded: amount ?? booking.amountPaid ?? booking.totalAmount }
            : booking
        )
      )
      toast.success('Refund processed successfully.')
      setRefundAmount('')
      setRefundReason('')
    } catch (err: any) {
      toast.error(getUserFriendlyError(err))
    } finally {
      setConfirmRefund(null)
    }
  }

  const handleExport = async () => {
    try {
      await downloadCsvExport('bookings')
      toast.success('Export started successfully')
    } catch (err: any) {
      toast.error(getUserFriendlyError(err))
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Track booking status, payments, and refunds."
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by booking ID, user, or property"
              value={searchTerm}
              onChange={(event) => {
                setPage(1)
                setSearchTerm(event.target.value)
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value as 'all' | BookingStatus)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load bookings"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchBookings}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No bookings match your filters' : 'No bookings yet'}
          description={
            hasFilters ? 'Try adjusting your search or status filter.' : 'Bookings will appear here once created.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Vendor Earns</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">#{booking.bookingNumber || booking.id}</p>
                    <p className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{booking.user?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-500">{booking.user?.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{booking.property?.name}</p>
                    <p className="text-xs text-slate-500">{booking.property?.type}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-slate-700">
                    {new Date(booking.checkInDate).toLocaleDateString()} -{' '}
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-semibold text-slate-900">₹{booking.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Paid: ₹{(booking.amountPaid ?? 0).toLocaleString()}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-semibold text-rose-600">₹{(booking.commissionAmount ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Rate: {booking.vendorCommissionRate || 0}%</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-semibold text-emerald-600">₹{(booking.vendorEarning ?? 0).toLocaleString()}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge label={statusLabels[booking.status]} variant={statusVariants[booking.status]} />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={booking.paymentStatus}
                    variant={paymentVariants[booking.paymentStatus]}
                    className="capitalize"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    {booking.paymentStatus === 'completed' && booking.status !== 'cancelled' ? (
                      <button
                        type="button"
                        onClick={() => {
                            setConfirmRefund({ 
                              bookingId: booking.id, 
                              maxAmount: booking.amountPaid || booking.totalAmount 
                            })
                            setRefundAmount('')
                            setRefundReason('')
                          }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refund
                      </button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && bookings.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmRefund)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRefund(null)
            setRefundAmount('')
            setRefundReason('')
          }
        }}
        title="Process refund?"
        confirmText="Process refund"
        variant="danger"
        onConfirm={confirmRefundAction}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">The booking will be marked cancelled and the refund will be triggered through Razorpay.</p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-600">Refund Amount (₹)</label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                placeholder={confirmRefund?.maxAmount?.toString() || 'Full amount'}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                min={0}
                max={confirmRefund?.maxAmount || undefined}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              />
              <span className="text-xs text-gray-500">
                Max: ₹{confirmRefund?.maxAmount?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-500">Leave empty to refund the full amount</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-rose-600">Refund Reason</label>
            <textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="Explain why the booking is being refunded"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
              rows={3}
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  )
}
