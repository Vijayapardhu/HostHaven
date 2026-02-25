import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { inventoryService, type InventoryItem } from '../lib/inventory'
import { PageHeader } from '../components/ui/PageHeader'
import { FiltersBar } from '../components/ui/FiltersBar'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmReset, setConfirmReset] = useState<{ propertyId: string; roomTypeId: string; date: string } | null>(null)

  const fetchInventory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await inventoryService.getPropertyInventory('all', {
        startDate: undefined,
        endDate: undefined,
      })
      setInventory(data.data ?? data.inventory ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load inventory overrides.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory
    const query = searchTerm.toLowerCase()
    return inventory.filter((item) =>
      [item.roomTypeName, item.propertyId, item.roomTypeId].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    )
  }, [inventory, searchTerm])

  const resetOverride = async () => {
    if (!confirmReset) return
    try {
      await inventoryService.resetOverride(confirmReset.propertyId, confirmReset.roomTypeId, confirmReset.date)
      setInventory((prev) => prev.filter((item) => item.roomTypeId !== confirmReset.roomTypeId || item.date !== confirmReset.date))
      toast.success('Override removed successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to remove override.')
    } finally {
      setConfirmReset(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Override room availability by date to avoid double bookings."
      />

      <FiltersBar>
        <SearchInput
          placeholder="Search by room type or property"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load inventory"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchInventory}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : filteredInventory.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No overrides match your search' : 'No overrides yet'}
          description={searchTerm ? 'Try adjusting your search.' : 'Overrides will appear here when applied.'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Override</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.slice((page - 1) * pageSize, page * pageSize).map((item) => (
              <TableRow key={`${item.roomTypeId}-${item.date}`}>
                <TableCell>
                  <p className="text-sm text-slate-700">{item.propertyId}</p>
                </TableCell>
                <TableCell>
                  <p className="font-semibold text-slate-900">{item.roomTypeName}</p>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{new Date(item.date).toLocaleDateString()}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-700">{item.overrideRooms ?? '—'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-700">{item.availableRooms}</span>
                </TableCell>
                <TableCell className="text-right">
                  {item.overrideRooms !== undefined ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset({ propertyId: item.propertyId, roomTypeId: item.roomTypeId, date: item.date })}
                      className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reset
                    </button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && filteredInventory.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredInventory.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmReset)}
        onOpenChange={(open) => {
          if (!open) setConfirmReset(null)
        }}
        title="Remove override?"
        description="This will restore the original inventory for that date."
        confirmText="Remove override"
        variant="danger"
        onConfirm={resetOverride}
      />
    </div>
  )
}
