import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Building2, 
  Banknote, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Upload, 
  DollarSign,
  User,
  FileText,
  CreditCard,
  Smartphone,
  Mail
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageLoader } from '@/components/ui/PageLoader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import api from '@/lib/api'
import { getFieldHint, validateField } from '@/lib/formValidation'

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

interface BookingEntry {
  id: string
  bookingId: string
  booking: {
    id: string
    bookingNumber: string
    user: { name: string; email: string; phone: string }
    property: { name: string; city: string }
    room: { name: string }
    checkInDate: string
    checkOutDate: string
    totalAmount: number
  }
  bookingAmount: number
  commissionRate: number
  commissionAmount: number
  vendorEarning: number
  createdAt: string
}

interface PayoutDetail {
  id: string
  vendor: {
    id: string
    businessName: string
    bankName?: string
    bankAccount?: string
    ifscCode?: string
    upiId?: string
    upiQrCode?: string
    user: { name: string; email: string; phone: string }
  }
  amount: number
  status: string
  periodStart: string
  periodEnd: string
  transactionId?: string
  paymentScreenshot?: string
  vendorVerified: boolean
  vendorVerifiedAt?: string
  vendorNotes?: string
  processedAt?: string
  processedBy?: string
  createdAt: string
  commissionEntries: BookingEntry[]
}

const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  completed: 'success',
  approved: 'warning',
  processing: 'warning',
  pending: 'warning',
  rejected: 'danger',
}

const canMarkAsPaid = (status: string) => {
  const normalized = status?.toUpperCase?.() ?? ''
  return normalized === 'APPROVED'
}

const canApprovePayout = (status: string) => {
  const normalized = status?.toUpperCase?.() ?? ''
  return normalized === 'PENDING' || normalized === 'PROCESSING'
}

export default function PayoutDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payout, setPayout] = useState<PayoutDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [txnId, setTxnId] = useState('')
  const [txnIdError, setTxnIdError] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string>('')
  const [vendorNotes, setVendorNotes] = useState('')

  useEffect(() => {
    if (id) fetchPayout()
  }, [id])

  const fetchPayout = async () => {
    try {
      const response = await api.get(`/v1/admin/payouts/${id}`)
      setPayout(response.data?.data ?? response.data)
      setTxnId(response.data?.data?.transactionId ?? '')
      setScreenshotPreview(response.data?.data?.paymentScreenshot ?? '')
      setVendorNotes(response.data?.data?.vendorNotes ?? '')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load payout details'))
      navigate('/payments?tab=payouts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshot(file)
      setScreenshotPreview(URL.createObjectURL(file))
    }
  }

  const handleMarkAsPaid = async () => {
    if (!payout) return

    const trimmedTxnId = txnId.trim()
    const validation = validateField('transactionId', trimmedTxnId)
    if (!validation.valid) {
      setTxnIdError(validation.errors[0] || 'Invalid transaction ID')
      toast.error(validation.errors[0] || 'Invalid transaction ID')
      return
    }

    setIsSaving(true)
    try {
      let screenshotUrl = payout.paymentScreenshot
      if (screenshot) {
        const formData = new FormData()
        formData.append('file', screenshot)
        const uploadRes = await api.post('/v1/uploads/single?folder=payouts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        screenshotUrl = uploadRes.data?.data?.url ?? uploadRes.data?.url
      }

      await api.put(`/v1/admin/payouts/${payout.id}/mark-paid`, {
        transactionId: trimmedTxnId,
        paymentScreenshot: screenshotUrl,
      })
      toast.success('Payout marked as paid')
      setTxnIdError('')
      fetchPayout()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update payout'))
    } finally {
      setIsSaving(false)
      setConfirmComplete(false)
    }
  }

  const handleApprovePayout = async () => {
    if (!payout) return

    setIsApproving(true)
    try {
      await api.post('/v1/admin/payouts/process', {
        payoutId: payout.id,
        action: 'approve',
      })
      toast.success('Payout approved')
      fetchPayout()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve payout'))
    } finally {
      setIsApproving(false)
    }
  }

  if (isLoading) return <PageLoader />

  if (!payout) return null

  const totalBookingAmount = payout.commissionEntries?.reduce((sum, e) => sum + e.bookingAmount, 0) || 0
  const totalCommission = payout.commissionEntries?.reduce((sum, e) => sum + e.commissionAmount, 0) || 0
  const totalVendorEarning = payout.commissionEntries?.reduce((sum, e) => sum + e.vendorEarning, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/payments?tab=payouts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Payout #${payout.id.slice(0, 8)}`}
          description={`Payout for ${payout.vendor.businessName}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor & Payment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{payout.vendor.businessName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Person</Label>
                  <p className="font-medium">{payout.vendor.user.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{payout.vendor.user.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{payout.vendor.user.phone || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank & Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payout.vendor.bankName && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Bank Transfer</span>
                    </div>
                    <p className="text-sm">Bank: {payout.vendor.bankName}</p>
                    <p className="text-sm">Account: {payout.vendor.bankAccount}</p>
                    <p className="text-sm">IFSC: {payout.vendor.ifscCode}</p>
                  </div>
                )}
                {payout.vendor.upiId && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">UPI Payment</span>
                    </div>
                    <p className="text-sm">UPI ID: {payout.vendor.upiId}</p>
                  </div>
                )}
              </div>

              {canMarkAsPaid(payout.status) && !payout.transactionId && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label>Transaction ID</Label>
                    <Input 
                      value={txnId} 
                      onChange={(e) => {
                        const value = e.target.value
                        setTxnId(value)
                        if (txnIdError) {
                          const result = validateField('transactionId', value.trim())
                          setTxnIdError(result.valid ? '' : (result.errors[0] || 'Invalid transaction ID'))
                        }
                      }}
                      onBlur={() => {
                        const result = validateField('transactionId', txnId.trim())
                        setTxnIdError(result.valid ? '' : (result.errors[0] || 'Invalid transaction ID'))
                      }}
                      placeholder="Enter transaction ID"
                      maxLength={120}
                      className={txnIdError ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
                    />
                    {txnIdError ? (
                      <p className="mt-1 text-xs text-rose-600">{txnIdError}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">{getFieldHint('transactionId')}</p>
                    )}
                  </div>
                  <div>
                    <Label>Payment Screenshot</Label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleScreenshotChange}
                    />
                    {screenshotPreview && (
                      <div className="mt-2">
                        <img src={screenshotPreview} alt="Payment screenshot" className="h-32 object-contain rounded-lg border" />
                      </div>
                    )}
                  </div>
                  <Button onClick={() => setConfirmComplete(true)} disabled={isSaving}>
                    {isSaving ? 'Processing...' : 'Mark as Paid'}
                  </Button>
                </div>
              )}

              {!canMarkAsPaid(payout.status) && !payout.transactionId && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    This payout must be approved before it can be marked as paid.
                  </p>
                  {canApprovePayout(payout.status) && (
                    <Button className="mt-3" onClick={handleApprovePayout} disabled={isApproving}>
                      {isApproving ? 'Approving...' : 'Approve Payout'}
                    </Button>
                  )}
                </div>
              )}

              {payout.transactionId && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Transaction ID:</span> {payout.transactionId}
                  </p>
                  {payout.paymentScreenshot && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600 mb-1">Payment Screenshot:</p>
                      <img src={payout.paymentScreenshot} alt="Payment screenshot" className="h-32 object-contain rounded-lg border" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bookings Included ({payout.commissionEntries?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Booking ID</th>
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-left p-3 font-semibold">Property</th>
                      <th className="text-left p-3 font-semibold">Check-in</th>
                      <th className="text-left p-3 font-semibold">Check-out</th>
                      <th className="text-right p-3 font-semibold">Amount</th>
                      <th className="text-right p-3 font-semibold">Your Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payout.commissionEntries?.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-mono text-sm">#{entry.booking.bookingNumber?.slice(0, 8) || entry.bookingId.slice(0, 8)}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{entry.booking.user.name}</p>
                          <p className="text-xs text-slate-500">{entry.booking.user.email}</p>
                          <p className="text-xs text-slate-500">{entry.booking.user.phone}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{entry.booking.property.name}</p>
                          <p className="text-xs text-slate-500">{entry.booking.property.city}</p>
                          <p className="text-xs text-slate-500">{entry.booking.room?.name}</p>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(entry.booking.checkInDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(entry.booking.checkOutDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right font-medium">
                          ₹{entry.bookingAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          ₹{entry.vendorEarning.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td className="p-3" colSpan={5}>Total</td>
                      <td className="p-3 text-right">₹{totalBookingAmount.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">₹{totalVendorEarning.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <StatusBadge 
                  label={payout.status} 
                  variant={statusVariants[payout.status] || 'neutral'} 
                />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payout Amount</span>
                <span className="font-bold text-lg">₹{payout.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Period</span>
                <span className="text-sm">
                  {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Created</span>
                <span className="text-sm">{new Date(payout.createdAt).toLocaleString()}</span>
              </div>
              {payout.processedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Processed</span>
                  <span className="text-sm">{new Date(payout.processedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {payout.vendorVerified ? (
                 <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Verified on {new Date(payout.vendorVerifiedAt).toLocaleDateString()}</span>
                </div>
               ) : payout.status === 'paid' ? (
                 <p className="text-sm text-slate-500">Vendor acknowledgment is completed in the vendor portal.</p>
               ) : (
                 <p className="text-sm text-slate-500">Vendor can acknowledge only after the payout is marked paid</p>
               )}
              {payout.vendorNotes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Vendor Notes:</p>
                  <p className="text-sm">{payout.vendorNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark as Paid Confirmation */}
      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={(open) => !open && setConfirmComplete(false)}
        title="Mark as Paid?"
        description="This will mark the payout as completed. Please ensure the payment has been transferred to the vendor's account."
        confirmText={isSaving ? 'Processing...' : 'Confirm Payment'}
        onConfirm={handleMarkAsPaid}
      />

    </div>
  )
}
