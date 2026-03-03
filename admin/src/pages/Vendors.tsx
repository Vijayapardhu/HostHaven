import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, CheckCircle, Eye, LayoutGrid, List } from 'lucide-react'
import { vendorsService, type Vendor } from '../lib/vendors'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

const statusOptions: Array<{ label: string; value: 'all' | VendorStatus }> = [
  { label: 'All status', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Suspended', value: 'suspended' },
]

const statusLabels: Record<VendorStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

const statusVariants: Record<VendorStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  suspended: 'danger',
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmAction, setConfirmAction] = useState<{
    vendorId: string
    nextStatus: 'suspended' | 'approved'
  } | null>(null)

  const fetchVendors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await vendorsService.getVendors({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setVendors(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load vendors.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [page, pageSize, searchTerm, statusFilter])

  const handleStatusChange = (vendor: Vendor, nextStatus: 'suspended' | 'approved') => {
    setConfirmAction({ vendorId: vendor.id, nextStatus })
  }

  const getInitials = (value: string) => {
    if (!value) return 'V'
    const parts = value.trim().split(' ').filter(Boolean)
    const initials = parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
    return initials || 'V'
  }

  const confirmStatusChange = async () => {
    if (!confirmAction) return
    const { vendorId, nextStatus } = confirmAction
    try {
      if (nextStatus === 'suspended') {
        await vendorsService.suspendVendor(vendorId)
      } else {
        await vendorsService.activateVendor(vendorId)
      }
      toast.success(`Vendor ${nextStatus === 'suspended' ? 'suspended' : 'activated'} successfully.`)
      setVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === vendorId ? { ...vendor, status: nextStatus === 'approved' ? 'approved' : 'suspended' } : vendor
        )
      )
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update vendor status.')
    } finally {
      setConfirmAction(null)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Track vendor onboarding, status, and payouts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
            </div>
            <Link
              to="/vendors/approval"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Pending approvals
            </Link>
            <Link
              to="/vendors/onboarding/new"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add vendor manually
            </Link>
          </div>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by vendor, business, or email"
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
              setStatusFilter(event.target.value as 'all' | VendorStatus)
            }}
            title="Filter vendors by status"
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
          title="Unable to load vendors"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchVendors}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : vendors.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No vendors match your filters' : 'No vendors yet'}
          description={
            hasFilters
              ? 'Try adjusting your search or status filter.'
              : 'New vendor registrations will appear here.'
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative h-24 bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">
                <div className="absolute inset-x-4 bottom-0 flex translate-y-1/2 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-sm font-semibold uppercase text-white">
                      {getInitials(vendor.businessName)}
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                      {vendor.businessType || 'Vendor'}
                    </div>
                  </div>
                  <StatusBadge
                    label={statusLabels[vendor.status]}
                    variant={statusVariants[vendor.status]}
                  />
                </div>
              </div>

              <div className="px-5 pb-5 pt-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{vendor.businessName}</p>
                    <p className="text-xs text-slate-500">{vendor.email}</p>
                  </div>
                  <Link
                    to={`/vendors/${vendor.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{vendor.phone || 'No phone on file'}</span>
                  <span>Joined {new Date(vendor.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold text-slate-600">Status</div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={vendor.status === 'approved'}
                      title={`Toggle vendor ${vendor.businessName} status`}
                      aria-label={`Toggle vendor ${vendor.businessName} status`}
                      onChange={() =>
                        handleStatusChange(
                          vendor,
                          vendor.status === 'approved' ? 'suspended' : 'approved'
                        )
                      }
                    />
                    <div className="peer h-5 w-10 rounded-full bg-slate-200 transition peer-checked:bg-emerald-500"></div>
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                    <p className="text-xs text-slate-500">Properties</p>
                    <p className="text-sm font-semibold text-slate-900">{vendor.propertiesCount ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                    <p className="text-xs text-slate-500">Bookings</p>
                    <p className="text-sm font-semibold text-slate-900">—</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Commission</span>
                  <span className="font-semibold text-slate-700">{vendor.commissionRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold uppercase text-white">
                  {getInitials(vendor.businessName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{vendor.businessName}</p>
                  <p className="text-xs text-slate-500">{vendor.email}</p>
                  <p className="text-xs text-slate-400">{vendor.phone || 'No phone on file'}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-between gap-3 sm:justify-end">
                <div className="flex items-center gap-2">
                  <StatusBadge label={statusLabels[vendor.status]} variant={statusVariants[vendor.status]} />
                  <span className="text-xs text-slate-500">Joined {new Date(vendor.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {vendor.businessType || 'Vendor'}
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {vendor.commissionRate}% commission
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/vendors/${vendor.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                  {vendor.status === 'approved' ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(vendor, 'suspended')}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Ban className="h-4 w-4" />
                      Suspend
                    </button>
                  ) : vendor.status === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(vendor, 'approved')}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Activate
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && vendors.length > 0 ? (
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
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={confirmAction?.nextStatus === 'suspended' ? 'Suspend this vendor?' : 'Reactivate this vendor?'}
        description={
          confirmAction?.nextStatus === 'suspended'
            ? 'The vendor will lose access and listings will be hidden.'
            : 'The vendor will regain access immediately.'
        }
        confirmText={confirmAction?.nextStatus === 'suspended' ? 'Suspend vendor' : 'Activate vendor'}
        variant={confirmAction?.nextStatus === 'suspended' ? 'danger' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
