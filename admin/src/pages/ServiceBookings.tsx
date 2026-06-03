import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { serviceBookingsService, type ServiceBooking } from '../lib/serviceBookings'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type ServiceBookingStatus = 'ADVANCE_PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
type ServicePaymentStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED'

const statusOptions: Array<{ label: string; value: 'all' | ServiceBookingStatus }> = [
  { label: 'All status', value: 'all' },
  { label: 'Advance paid', value: 'ADVANCE_PAID' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

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

const paymentVariants: Record<ServicePaymentStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  REFUNDED: 'neutral',
}

export default function ServiceBookings() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceBookingStatus>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmReject, setConfirmReject] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [confirmRefund, setConfirmRefund] = useState<ServiceBooking | null>(null)

  const fetchBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await serviceBookingsService.getServiceBookings({
        page,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      const source = data.data ?? []
      const filtered = searchTerm
        ? source.filter((booking: ServiceBooking) => {
            const haystack = [
              booking.serviceBookingNumber,
              booking.bookingNumber,
              booking.user?.name,
              booking.user?.phone,
              booking.serviceName,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            return haystack.includes(searchTerm.toLowerCase())
          })
        : source
      setBookings(filtered)
      setTotal(data.pagination?.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load service bookings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, pageSize, searchTerm, statusFilter])

  const handleAccept = async (bookingId: string) => {
    try {
      await serviceBookingsService.acceptServiceBooking(bookingId)
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'CONFIRMED' } : booking
        )
      )
      toast.success('Service booking accepted.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to accept service booking.')
    }
  }

  const handleComplete = async (bookingId: string) => {
    try {
      await serviceBookingsService.completeServiceBooking(bookingId)
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'COMPLETED' } : booking
        )
      )
      toast.success('Service booking marked as completed.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update service booking.')
    }
  }

  const handleReject = async () => {
    if (!confirmReject) return
    try {
      await serviceBookingsService.rejectServiceBooking(confirmReject, 'Rejected by admin')
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === confirmReject ? { ...booking, status: 'CANCELLED' } : booking
        )
      )
      toast.success('Service booking rejected.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to reject service booking.')
    } finally {
      setConfirmReject(null)
    }
  }

  const handleCancel = async () => {
    if (!confirmCancel) return
    try {
      await serviceBookingsService.cancelServiceBooking(confirmCancel, 'Cancelled by admin')
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === confirmCancel ? { ...booking, status: 'CANCELLED' } : booking
        )
      )
      toast.success('Service booking cancelled.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to cancel service booking.')
    } finally {
      setConfirmCancel(null)
    }
  }

  const handleRefund = async () => {
    if (!confirmRefund) return
    try {
      const refundAmount = confirmRefund.advanceAmount ?? confirmRefund.totalAmount
      await serviceBookingsService.processServiceRefund(confirmRefund.id, refundAmount, 'Refund issued by admin')
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === confirmRefund.id
            ? { ...booking, paymentStatus: 'REFUNDED', status: 'CANCELLED' }
            : booking
        )
      )
      toast.success('Refund processed successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to process refund.')
    } finally {
      setConfirmRefund(null)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Bookings"
        description="Review service bookings, statuses, and payments."
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by booking number, user, or service"
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
              setStatusFilter(event.target.value as 'all' | ServiceBookingStatus)
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
          title="Unable to load service bookings"
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
          title={hasFilters ? 'No bookings match your filters' : 'No service bookings yet'}
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
              <TableHead>Service</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Amount</TableHead>
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
                    <p className="font-semibold text-slate-900">#{booking.serviceBookingNumber || booking.bookingNumber || booking.id}</p>
                    <p className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{booking.user?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-500">{booking.user?.phone || '—'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{booking.serviceName || booking.service?.name || 'Service'}</p>
                    <p className="text-xs text-slate-500">Category: {booking.serviceCategory || '—'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm text-slate-700">{booking.serviceDate ? new Date(booking.serviceDate).toLocaleDateString() : '—'}</p>
                    <p className="text-xs text-slate-500">{booking.serviceTime || '—'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">₹{booking.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Advance: ₹{(booking.advanceAmount ?? 0).toLocaleString()}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge label={statusLabels[booking.status]} variant={statusVariants[booking.status]} />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={booking.paymentStatus ? booking.paymentStatus.toLowerCase() : 'pending'}
                    variant={paymentVariants[booking.paymentStatus || 'PENDING']}
                    className="capitalize"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={`/service-bookings/${booking.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    {booking.status === 'ADVANCE_PAID' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(booking.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReject(booking.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {booking.status === 'CONFIRMED' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleComplete(booking.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmCancel(booking.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                    {booking.paymentStatus === 'COMPLETED' && booking.status !== 'CANCELLED' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmRefund(booking)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
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
        open={Boolean(confirmReject)}
        onOpenChange={(open) => {
          if (!open) setConfirmReject(null)
        }}
        title="Reject this booking?"
        description="The booking will be marked as rejected."
        confirmText="Reject booking"
        variant="danger"
        onConfirm={handleReject}
      />

      <ConfirmDialog
        open={Boolean(confirmCancel)}
        onOpenChange={(open) => {
          if (!open) setConfirmCancel(null)
        }}
        title="Cancel this booking?"
        description="The booking will be cancelled and the guest will be notified."
        confirmText="Cancel booking"
        variant="danger"
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={Boolean(confirmRefund)}
        onOpenChange={(open) => {
          if (!open) setConfirmRefund(null)
        }}
        title="Process refund?"
        description="The refund will be issued and the booking will be cancelled."
        confirmText="Process refund"
        variant="danger"
        onConfirm={handleRefund}
      />
    </div>
  )
}
