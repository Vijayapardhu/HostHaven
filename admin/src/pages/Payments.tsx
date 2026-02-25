import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { paymentsService, type Payment, type Payout } from '../lib/payments'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type Tab = 'payments' | 'payouts'

export default function Payments() {
  const [activeTab, setActiveTab] = useState<Tab>('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmRefund, setConfirmRefund] = useState<{ paymentId: string } | null>(null)

  const fetchPayments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getPayments({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
      })
      setPayments(data.data ?? data.payments ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payments.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayouts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getPayouts({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
      })
      setPayouts(data.data ?? data.payouts ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payouts.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments()
    } else {
      fetchPayouts()
    }
  }, [activeTab, page, pageSize, searchTerm])

  const confirmRefundAction = async () => {
    if (!confirmRefund) return
    try {
      await paymentsService.refundPayment(confirmRefund.paymentId, 'Admin initiated')
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === confirmRefund.paymentId ? { ...payment, status: 'refunded' } : payment
        )
      )
      toast.success('Refund processed successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to process refund.')
    } finally {
      setConfirmRefund(null)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0, [searchTerm])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track transactions, refunds, and vendor payouts."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('payments')
            setPage(1)
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Payments
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('payouts')
            setPage(1)
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            activeTab === 'payouts'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Payouts
        </button>
      </div>

      <FiltersBar>
        <SearchInput
          placeholder={`Search ${activeTab}`}
          value={searchTerm}
          onChange={(event) => {
            setPage(1)
            setSearchTerm(event.target.value)
          }}
        />
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title={`Unable to load ${activeTab}`}
          description={error}
          action={
            <button
              type="button"
              onClick={activeTab === 'payments' ? fetchPayments : fetchPayouts}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : activeTab === 'payments' ? (
        payments.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No payments match your search' : 'No payments yet'}
            description={hasFilters ? 'Try adjusting your search.' : 'Payments will appear here.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{payment.transactionId}</p>
                      <p className="text-xs text-slate-500">Booking {payment.bookingId || payment.serviceBookingId || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-slate-900">₹{payment.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{payment.method}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={payment.status}
                      variant={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : payment.status === 'refunded' ? 'neutral' : 'danger'}
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === 'completed' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmRefund({ paymentId: payment.id })}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Refund
                      </button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : payouts.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No payouts match your search' : 'No payouts yet'}
          description={hasFilters ? 'Try adjusting your search.' : 'Payouts will appear here.'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payout</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>
                  <p className="font-semibold text-slate-900">{payout.referenceId || payout.id}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-slate-700">{payout.vendorName}</p>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold text-slate-900">₹{payout.amount.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={payout.status}
                    variant={payout.status === 'completed' ? 'success' : payout.status === 'processing' ? 'info' : payout.status === 'failed' ? 'danger' : 'warning'}
                    className="capitalize"
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{new Date(payout.createdAt).toLocaleDateString()}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && (activeTab === 'payments' ? payments.length > 0 : payouts.length > 0) ? (
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
          if (!open) setConfirmRefund(null)
        }}
        title="Process refund?"
        description="This will trigger a Razorpay refund for the payment."
        confirmText="Process refund"
        variant="danger"
        onConfirm={confirmRefundAction}
      />
    </div>
  )
}
