import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { propertiesService, type Property } from '../lib/properties'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export default function PropertyApproval() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmAction, setConfirmAction] = useState<{
    propertyId: string
    action: 'approve' | 'reject'
  } | null>(null)

  const fetchPendingProperties = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await propertiesService.getPendingProperties({ page, limit: pageSize })
      setProperties(data.data ?? data.properties ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load pending properties.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingProperties()
  }, [page, pageSize])

  const filteredProperties = useMemo(() => {
    const query = searchTerm.toLowerCase()
    if (!query) return properties
    return properties.filter((property) =>
      [property.name, property.address, property.city].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    )
  }, [searchTerm, properties])

  const handleApproval = (propertyId: string, action: 'approve' | 'reject') => {
    setConfirmAction({ propertyId, action })
  }

  const confirmApproval = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.action === 'approve') {
        await propertiesService.approveProperty(confirmAction.propertyId)
        toast.success('Property approved successfully.')
      } else {
        await propertiesService.rejectProperty(confirmAction.propertyId)
        toast.success('Property rejected successfully.')
      }
      setProperties((prev) => prev.filter((property) => property.id !== confirmAction.propertyId))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update property approval.')
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Approval"
        description="Review and approve hotel and home listings before they go live."
      />

      <FiltersBar>
        <SearchInput
          placeholder="Search pending properties"
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
              onClick={fetchPendingProperties}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="You are all caught up with property applications."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{property.name}</p>
                    <p className="text-xs text-slate-500">{property.address}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {property.type === 'hotel' ? 'Hotel' : 'Home'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{property.city}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproval(property.id, 'reject')}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproval(property.id, 'approve')}
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

      {!isLoading && !error && filteredProperties.length > 0 ? (
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
        title={confirmAction?.action === 'approve' ? 'Approve this property?' : 'Reject this property?'}
        description={
          confirmAction?.action === 'approve'
            ? 'The property will go live once approved.'
            : 'The property application will be rejected.'
        }
        confirmText={confirmAction?.action === 'approve' ? 'Approve property' : 'Reject property'}
        variant={confirmAction?.action === 'approve' ? 'default' : 'danger'}
        onConfirm={confirmApproval}
      />
    </div>
  )
}
