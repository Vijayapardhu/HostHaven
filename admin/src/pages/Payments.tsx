import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { paymentsService, type Payment, type Payout, type RefundItem } from '../lib/payments'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormInput } from '../components/ui/FormInput'
import { downloadCsvExport } from '../lib/export'
import api from '../lib/api'

type ApiError = {
  response?: {
    data?: {
      message?: string
      error?: { message?: string }
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError
  return apiError?.response?.data?.error?.message || apiError?.response?.data?.message || apiError?.message || fallback
}

type Tab = 'payments' | 'payouts' | 'refunds'

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const resolveTab = (): Tab => {
    const tab = searchParams.get('tab')
    if (tab === 'payouts' || tab === 'refunds') return tab
    return 'payments'
  }

  const [activeTab, setActiveTab] = useState<Tab>(resolveTab())
  const [payments, setPayments] = useState<Payment[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [refunds, setRefunds] = useState<RefundItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmRefund, setConfirmRefund] = useState<{ paymentId: string; paymentAmount: number } | null>(null)
  const [confirmPayout, setConfirmPayout] = useState<{ payoutId: string } | null>(null)
  const [approvingPayoutId, setApprovingPayoutId] = useState<string | null>(null)
  const [txnIdInput, setTxnIdInput] = useState('')
  const [payoutScreenshotFile, setPayoutScreenshotFile] = useState<File | null>(null)
  const [payoutScreenshotPreview, setPayoutScreenshotPreview] = useState('')
  const [refundAmountInput, setRefundAmountInput] = useState('')
  const [refundReasonInput, setRefundReasonInput] = useState('')

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  const fetchPayments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getPayments({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined,
      })
      setPayments(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load payments.'))
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
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined,
      })
      setPayouts(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load payouts.'))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRefunds = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await paymentsService.getRefunds({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined,
      })
      setRefunds(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load refunds.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const tabFromUrl = resolveTab()
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
      return
    }

    if (activeTab === 'payments') {
      fetchPayments()
    } else if (activeTab === 'payouts') {
      fetchPayouts()
    } else {
      fetchRefunds()
    }
  }, [activeTab, page, pageSize, searchTerm, statusFilter, startDate, endDate, searchParams])

  const confirmPayoutAction = async () => {
    if (!confirmPayout || !txnIdInput.trim()) {
      toast.error('Please enter a transaction ID')
      return
    }

    if (!payoutScreenshotFile) {
      toast.error('Please attach payment screenshot')
      return
    }

    const txnId = txnIdInput.trim()
    
    // Validate transaction ID format
    if (txnId.length < 3) {
      toast.error('Transaction ID must be at least 3 characters long')
      return
    }
    
    if (txnId.length > 120) {
      toast.error('Transaction ID must not exceed 120 characters')
      return
    }
    
    // Only alphanumeric, hyphens, and underscores allowed
    if (!/^[A-Za-z0-9\-_]+$/.test(txnId)) {
      toast.error('Transaction ID can only contain letters, numbers, hyphens (-), and underscores (_)')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', payoutScreenshotFile)

      const uploadRes = await api.post('/v1/uploads/single?folder=payouts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const screenshotUrl = uploadRes.data?.data?.url ?? uploadRes.data?.url
      if (!screenshotUrl) {
        throw new Error('Failed to upload payment screenshot')
      }

      await api.put(`/v1/admin/payouts/${confirmPayout.payoutId}/mark-paid`, {
        transactionId: txnId,
        paymentScreenshot: screenshotUrl,
      })

      setPayouts((prev) =>
        prev.map((p) =>
          p.id === confirmPayout.payoutId ? { ...p, status: 'paid', referenceId: txnId } : p
        )
      )
      toast.success('Payout marked as paid.')
      setTxnIdInput('')
      setPayoutScreenshotFile(null)
      setPayoutScreenshotPreview('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update payout.'))
    } finally {
      setConfirmPayout(null)
    }
  }

  const handlePayoutScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file for payment screenshot')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Payment screenshot must be less than 10MB')
      return
    }

    setPayoutScreenshotFile(file)
    setPayoutScreenshotPreview(URL.createObjectURL(file))
  }

  const approvePayout = async (payoutId: string) => {
    setApprovingPayoutId(payoutId)
    try {
      await api.post('/v1/admin/payouts/process', {
        payoutId,
        action: 'approve',
      })

      setPayouts((prev) =>
        prev.map((payout) =>
          payout.id === payoutId ? { ...payout, status: 'approved' } : payout
        )
      )

      toast.success('Payout approved. You can now mark it as paid.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve payout.'))
    } finally {
      setApprovingPayoutId(null)
    }
  }

  const confirmRefundAction = async () => {
    if (!confirmRefund) return
    const amount = Number(refundAmountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid refund amount')
      return
    }
    const payment = payments.find((entry) => entry.id === confirmRefund.paymentId)
    const refundableBalance = payment?.refundableBalance ?? confirmRefund.paymentAmount
    if (amount > refundableBalance) {
      toast.error('Refund amount cannot exceed the remaining refundable balance')
      return
    }
    if (refundReasonInput.trim().length < 5) {
      toast.error('Refund reason must be at least 5 characters')
      return
    }
    try {
      await paymentsService.refundPayment(confirmRefund.paymentId, amount, refundReasonInput.trim())
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === confirmRefund.paymentId
            ? {
                ...payment,
                status: amount < refundableBalance ? 'partially_refunded' : 'refunded',
                refundableBalance: Math.max(0, refundableBalance - amount),
              }
            : payment
        )
      )
      toast.success('Refund processed successfully.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to process refund.'))
    } finally {
      setConfirmRefund(null)
      setRefundAmountInput('')
      setRefundReasonInput('')
    }
  }

  const handleExport = async () => {
    try {
      await downloadCsvExport(activeTab)
      toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} export started successfully`)
    } catch (err) {
      toast.error(`Failed to export ${activeTab} data`)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all' || Boolean(startDate) || Boolean(endDate), [searchTerm, statusFilter, startDate, endDate])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track transactions, refunds, and vendor payouts."
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} CSV
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchTab('payments')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'payments'
            ? 'bg-slate-900 text-white'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
        >
          Payments
        </button>
        <button
          type="button"
          onClick={() => switchTab('payouts')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'payouts'
            ? 'bg-slate-900 text-white'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
        >
          Payouts
        </button>
        <button
          type="button"
          onClick={() => switchTab('refunds')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === 'refunds'
            ? 'bg-slate-900 text-white'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
        >
          Refunds
        </button>
      </div>

      <FiltersBar>
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-4">
          <SearchInput
            placeholder={`Search ${activeTab}`}
            value={searchTerm}
            onChange={(event) => {
              setPage(1)
              setSearchTerm(event.target.value)
            }}
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value)
            }}
            title="Filter by status"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
              {(activeTab === 'payouts'
              ? ['pending', 'approved', 'paid', 'rejected']
                : activeTab === 'refunds'
                  ? ['processed', 'pending']
                  : ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded']
            ).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              setPage(1)
              setStartDate(event.target.value)
            }}
            title="Start date"
            placeholder="Start date"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => {
              setPage(1)
              setEndDate(event.target.value)
            }}
            title="End date"
            placeholder="End date"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          />
        </div>
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
               onClick={activeTab === 'payments' ? fetchPayments : activeTab === 'payouts' ? fetchPayouts : fetchRefunds}
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
                      <p className="text-xs text-slate-500">
                        Booking {payment.bookingNumber || payment.bookingId || payment.serviceBookingId || '—'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-slate-900">₹{payment.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 uppercase">{payment.method}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={payment.status}
                      variant={
                        payment.status === 'completed'
                          ? 'success'
                          : payment.status === 'pending' || payment.status === 'processing'
                            ? 'warning'
                            : payment.status === 'refunded' || payment.status === 'partially_refunded'
                              ? 'neutral'
                              : 'danger'
                      }
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/payments/${payment.id}`}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Details
                      </Link>
                       {(payment.status === 'completed' || payment.status === 'partially_refunded') && (payment.refundableBalance ?? 0) > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmRefund({ paymentId: payment.id, paymentAmount: payment.amount })
                              setRefundAmountInput(String(payment.refundableBalance ?? payment.amount))
                              setRefundReasonInput('')
                            }}
                           className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                         >
                          Refund
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : activeTab === 'payouts' ? (
        payouts.length === 0 ? (
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
                <TableHead className="text-right">Actions</TableHead>
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
                       variant={payout.status === 'paid' ? 'success' : payout.status === 'approved' ? 'info' : payout.status === 'rejected' ? 'danger' : 'warning'}
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{new Date(payout.createdAt).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/payouts/${payout.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                      {payout.status === 'pending' || payout.status === 'processing' ? (
                        <button
                          type="button"
                          onClick={() => approvePayout(payout.id)}
                          disabled={approvingPayoutId === payout.id}
                          className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          {approvingPayoutId === payout.id ? 'Approving...' : 'Approve'}
                        </button>
                      ) : null}
                       {payout.status === 'approved' ? (
                        <button
                          type="button"
                          onClick={() => setConfirmPayout({ payoutId: payout.id })}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mark Paid
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : (
        refunds.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No refunds match your search' : 'No refunds yet'}
            description={hasFilters ? 'Try adjusting your search.' : 'Refunds will appear here.'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund ID</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    <p className="font-semibold text-slate-900 truncate max-w-[120px]" title={refund.razorpayRefundId || refund.id}>
                      {refund.razorpayRefundId || refund.id}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-700">{refund.bookingNumber || '—'}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-slate-900 text-rose-600">-₹{refund.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={refund.status}
                      variant={refund.status === 'processed' ? 'success' : 'warning'}
                      className="capitalize"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-600 max-w-[200px] truncate" title={refund.reason}>
                      {refund.reason || '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{new Date(refund.createdAt).toLocaleDateString()}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      )}

      {!isLoading && !error && (
        (activeTab === 'payments' && payments.length > 0) ||
        (activeTab === 'payouts' && payouts.length > 0) ||
        (activeTab === 'refunds' && refunds.length > 0)
      ) ? (
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
        open={Boolean(confirmPayout)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmPayout(null)
            setTxnIdInput('')
            setPayoutScreenshotFile(null)
            setPayoutScreenshotPreview('')
          }
        }}
        title="Mark payout as paid?"
        confirmText="Confirm Payout"
        onConfirm={confirmPayoutAction}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Enter the transaction ID from Razorpay to mark this payout as completed.</p>
          <FormInput
            label="Transaction ID"
            name="transactionId"
            type="text"
            value={txnIdInput}
            onChange={setTxnIdInput}
            placeholder="e.g. pay_1234567890"
            validateOnBlur
            showValidationHint
            required
          />
          <div>
            <label className="text-sm font-medium text-gray-700">Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePayoutScreenshotChange}
              title="Upload payment screenshot"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Upload screenshot proof of payment (max 10MB).</p>
            {payoutScreenshotPreview ? (
              <div className="mt-2">
                <img
                  src={payoutScreenshotPreview}
                  alt="Payment screenshot preview"
                  className="h-28 rounded border object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(confirmRefund)}
        onOpenChange={(open) => {
          if (!open) setConfirmRefund(null)
        }}
        title="Process refund?"
        description="Enter the exact refund amount and a clear business reason. This action is audited."
        confirmText="Process refund"
        variant="danger"
        onConfirm={confirmRefundAction}
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Refund Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={refundAmountInput}
              onChange={(e) => setRefundAmountInput(e.target.value)}
              title="Refund amount"
              placeholder="Enter refund amount"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={refundReasonInput}
              onChange={(e) => setRefundReasonInput(e.target.value)}
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
