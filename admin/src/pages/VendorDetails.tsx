import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Building2, Mail, Phone, Wallet } from 'lucide-react'
import { vendorsService, type Vendor } from '../lib/vendors'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commissionRate, setCommissionRate] = useState('')
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'suspended' | 'approved' | null>(null)

  const fetchVendor = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await vendorsService.getVendorById(id)
      setVendor(data)
      setCommissionRate(String(data.commissionRate ?? ''))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load vendor details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVendor()
  }, [id])

  const statusLabel = useMemo(() => {
    if (!vendor) return ''
    if (vendor.status === 'approved') return 'Approved'
    if (vendor.status === 'pending') return 'Pending'
    if (vendor.status === 'rejected') return 'Rejected'
    return 'Suspended'
  }, [vendor])

  const statusVariant = useMemo(() => {
    if (!vendor) return 'neutral' as const
    if (vendor.status === 'approved') return 'success' as const
    if (vendor.status === 'pending') return 'warning' as const
    if (vendor.status === 'rejected') return 'danger' as const
    return 'danger' as const
  }, [vendor])

  const confirmStatusChange = async () => {
    if (!vendor || !confirmAction) return
    try {
      if (confirmAction === 'suspended') {
        await vendorsService.suspendVendor(vendor.id)
        setVendor({ ...vendor, status: 'suspended' })
        toast.success('Vendor suspended successfully.')
      } else {
        await vendorsService.activateVendor(vendor.id)
        setVendor({ ...vendor, status: 'approved' })
        toast.success('Vendor reactivated successfully.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update vendor status.')
    } finally {
      setConfirmAction(null)
    }
  }

  const handleCommissionSave = async () => {
    if (!vendor) return
    const value = Number(commissionRate)
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error('Commission rate must be between 0 and 100.')
      return
    }
    setCommissionLoading(true)
    try {
      await vendorsService.setCommission(vendor.id, value)
      setVendor({ ...vendor, commissionRate: value })
      toast.success('Commission updated successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update commission.')
    } finally {
      setCommissionLoading(false)
    }
  }

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load vendor"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchVendor}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  if (!vendor) {
    return <EmptyState title="Vendor not found" description="This vendor record does not exist." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={vendor.businessName}
          description={`Vendor ID: ${vendor.id}`}
          actions={<StatusBadge label={statusLabel} variant={statusVariant} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendor profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Business type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{vendor.businessType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Hotel ID</p>
                  <p className="mt-1 text-sm text-slate-700">{vendor.hotelId || 'Not linked yet'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {vendor.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Phone</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {vendor.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Created</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">UPI ID</p>
                  <p className="mt-1 text-sm text-slate-700">{vendor.payoutDetails?.upiId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Bank account</p>
                  <p className="mt-1 text-sm text-slate-700">{vendor.payoutDetails?.bankAccount || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Bank name</p>
                  <p className="mt-1 text-sm text-slate-700">{vendor.payoutDetails?.bankName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">IFSC</p>
                  <p className="mt-1 text-sm text-slate-700">{vendor.payoutDetails?.ifsc || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={commissionRate}
                    onChange={(event) => setCommissionRate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleCommissionSave}
                  disabled={commissionLoading}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {commissionLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Commission applies to booking payouts for this vendor.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendor.status === 'approved' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('suspended')}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Suspend vendor
                  </button>
                ) : vendor.status === 'suspended' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('approved')}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    Reactivate vendor
                  </button>
                ) : null}
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                  <Wallet className="h-4 w-4" />
                  Commission: {vendor.commissionRate}%
                </div>
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
        title={confirmAction === 'suspended' ? 'Suspend this vendor?' : 'Reactivate this vendor?'}
        description={
          confirmAction === 'suspended'
            ? 'The vendor will lose access and listings will be hidden.'
            : 'The vendor will regain access immediately.'
        }
        confirmText={confirmAction === 'suspended' ? 'Suspend vendor' : 'Reactivate vendor'}
        variant={confirmAction === 'suspended' ? 'danger' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
