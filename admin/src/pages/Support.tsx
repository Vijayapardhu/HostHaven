import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supportService, type SupportTicket } from '../lib/support'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const statusVariants: Record<TicketStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  open: 'danger',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
}

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [confirmClose, setConfirmClose] = useState<string | null>(null)

  const fetchTickets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await supportService.getTickets({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setTickets(data.data ?? data.tickets ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load tickets.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [page, pageSize, searchTerm, statusFilter])

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      await supportService.updateTicketStatus(ticketId, status)
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket)))
      toast.success('Ticket status updated.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update ticket.')
    }
  }

  const addNote = async (ticketId: string) => {
    const content = noteInputs[ticketId]
    if (!content) return
    try {
      await supportService.addNote(ticketId, { content })
      setNoteInputs((prev) => ({ ...prev, [ticketId]: '' }))
      toast.success('Note added.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to add note.')
    }
  }

  const confirmCloseAction = async () => {
    if (!confirmClose) return
    try {
      await supportService.closeTicket(confirmClose)
      setTickets((prev) => prev.map((ticket) => (ticket.id === confirmClose ? { ...ticket, status: 'closed' } : ticket)))
      toast.success('Ticket closed.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to close ticket.')
    } finally {
      setConfirmClose(null)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Manage support tickets, update status, and add notes."
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by ticket number, subject, or email"
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
              setStatusFilter(event.target.value as 'all' | TicketStatus)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load tickets"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchTickets}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No tickets match your filters' : 'No tickets yet'}
          description={hasFilters ? 'Try adjusting your search or status filter.' : 'Support tickets will appear here.'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{ticket.ticketNumber || ticket.id}</p>
                    <p className="text-xs text-slate-500">{ticket.subject}</p>
                    <p className="text-xs text-slate-400">{ticket.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{ticket.category}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={ticket.priority}
                    variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'}
                    className="capitalize"
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge label={statusLabels[ticket.status]} variant={statusVariants[ticket.status]} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <select
                      value={ticket.status}
                      onChange={(event) => handleStatusChange(ticket.id, event.target.value as TicketStatus)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    {ticket.status !== 'closed' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClose(ticket.id)}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Close
                      </button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && tickets.length > 0 ? (
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
        open={Boolean(confirmClose)}
        onOpenChange={(open) => {
          if (!open) setConfirmClose(null)
        }}
        title="Close this ticket?"
        description="This will mark the ticket as closed."
        confirmText="Close ticket"
        variant="danger"
        onConfirm={confirmCloseAction}
      />
    </div>
  )
}
