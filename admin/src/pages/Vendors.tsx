import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, CheckCircle, Eye } from 'lucide-react'
import { vendorsService, type Vendor } from '../lib/vendors'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
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
      setVendors(data.data ?? data.vendors ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
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
          <Link
            to="/vendors/approval"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Pending approvals
          </Link>
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
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.email}</p>
                    <p className="text-xs text-slate-500">{vendor.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.businessName}</p>
                    <p className="text-xs text-slate-500">{vendor.businessType}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-700">{vendor.commissionRate}%</span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={statusLabels[vendor.status]}
                    variant={statusVariants[vendor.status]}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    {vendor.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(vendor, 'suspended')}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Ban className="h-4 w-4" />
                        Suspend
                      </button>
                    ) : vendor.status === 'suspended' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(vendor, 'approved')}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Activate
                      </button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
