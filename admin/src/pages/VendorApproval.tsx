import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { vendorsService, type Vendor } from '../lib/vendors'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export default function VendorApproval() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmAction, setConfirmAction] = useState<{
    vendorId: string
    action: 'approve' | 'reject'
  } | null>(null)

  const fetchPendingVendors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await vendorsService.getPendingVendors({ page, limit: pageSize })
      setVendors(data.data ?? data.vendors ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load pending vendors.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingVendors()
  }, [page, pageSize])

  const filteredVendors = useMemo(() => {
    const query = searchTerm.toLowerCase()
    if (!query) return vendors
    return vendors.filter((vendor) =>
      [vendor.email, vendor.phone, vendor.businessName].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    )
  }, [searchTerm, vendors])

  const handleApproval = (vendorId: string, action: 'approve' | 'reject') => {
    setConfirmAction({ vendorId, action })
  }

  const confirmApproval = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.action === 'approve') {
        await vendorsService.approveVendor(confirmAction.vendorId)
        toast.success('Vendor approved successfully.')
      } else {
        await vendorsService.rejectVendor(confirmAction.vendorId)
        toast.success('Vendor rejected successfully.')
      }
      setVendors((prev) => prev.filter((vendor) => vendor.id !== confirmAction.vendorId))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update vendor approval.')
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Approval"
        description="Review pending vendor registrations and approve or reject them."
      />

      <FiltersBar>
        <SearchInput
          placeholder="Search pending vendors"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={5} />
      ) : error ? (
        <EmptyState
          title="Unable to load approvals"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchPendingVendors}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : filteredVendors.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="You are all caught up with vendor applications."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => (
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
                  <span className="text-sm text-slate-600">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproval(vendor.id, 'reject')}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval(vendor.id, 'approve')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && filteredVendors.length > 0 ? (
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
        title={confirmAction?.action === 'approve' ? 'Approve this vendor?' : 'Reject this vendor?'}
        description={
          confirmAction?.action === 'approve'
            ? 'The vendor will go live once approved.'
            : 'The vendor application will be rejected.'
        }
        confirmText={confirmAction?.action === 'approve' ? 'Approve vendor' : 'Reject vendor'}
        variant={confirmAction?.action === 'approve' ? 'default' : 'danger'}
        onConfirm={confirmApproval}
      />
    </div>
  )
}
