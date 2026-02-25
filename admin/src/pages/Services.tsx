import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { servicesService, type Service } from '../lib/services'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type ServiceCategory = 'transport' | 'guide' | 'photography' | 'food' | 'other'

const categoryOptions: Array<{ label: string; value: 'all' | ServiceCategory }> = [
  { label: 'All categories', value: 'all' },
  { label: 'Transport', value: 'transport' },
  { label: 'Guide', value: 'guide' },
  { label: 'Photography', value: 'photography' },
  { label: 'Food & Dining', value: 'food' },
  { label: 'Other', value: 'other' },
]

const categoryLabels: Record<ServiceCategory, string> = {
  transport: 'Transport',
  guide: 'Guide',
  photography: 'Photography',
  food: 'Food & Dining',
  other: 'Other',
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategory>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchServices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await servicesService.getServices({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      })
      setServices(data.data ?? data.services ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load services.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [page, pageSize, searchTerm, categoryFilter])

  const toggleActive = async (service: Service) => {
    try {
      if (service.active) {
        await servicesService.deactivateService(service.id)
      } else {
        await servicesService.activateService(service.id)
      }
      setServices((prev) => prev.map((item) => (item.id === service.id ? { ...item, active: !service.active } : item)))
      toast.success(`Service ${service.active ? 'deactivated' : 'activated'} successfully.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update service status.')
    }
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return
    try {
      await servicesService.deleteService(confirmDelete)
      setServices((prev) => prev.filter((service) => service.id !== confirmDelete))
      toast.success('Service deleted successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to delete service.')
    } finally {
      setConfirmDelete(null)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || categoryFilter !== 'all', [searchTerm, categoryFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Manage service offerings and advance payment rules."
        actions={
          <Link
            to="/services/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add service
          </Link>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by service name"
              value={searchTerm}
              onChange={(event) => {
                setPage(1)
                setSearchTerm(event.target.value)
              }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setPage(1)
              setCategoryFilter(event.target.value as 'all' | ServiceCategory)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {categoryOptions.map((option) => (
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
          title="Unable to load services"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchServices}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : services.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No services match your filters' : 'No services yet'}
          description={
            hasFilters ? 'Try adjusting your search or category filter.' : 'Create a service to get started.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base price</TableHead>
              <TableHead>Advance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-500">{service.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {categoryLabels[service.category as ServiceCategory] || service.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-semibold text-slate-900">₹{service.basePrice.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {service.advanceType === 'percentage'
                      ? `${service.advanceValue ?? 0}%`
                      : `₹${(service.advanceValue ?? 0).toLocaleString()}`}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge label={service.active ? 'Active' : 'Inactive'} variant={service.active ? 'success' : 'neutral'} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={`/services/${service.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive(service)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                    >
                      {service.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(service.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && services.length > 0 ? (
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
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
        title="Delete this service?"
        description="This action cannot be undone."
        confirmText="Delete service"
        variant="danger"
        onConfirm={confirmDeleteAction}
      />
    </div>
  )
}
