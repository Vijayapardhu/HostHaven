import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  MessageSquare, X, User2, Send, RefreshCw,
  CheckCircle, ChevronRight, StickyNote, Mail
} from 'lucide-react'
import { supportService, type SupportTicket } from '../lib/support'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type TicketStatus = 'open' | 'in_progress' | 'resolved'

const statusLabels: Record<TicketStatus, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' }
const statusVariants: Record<TicketStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = { open: 'danger', in_progress: 'info', resolved: 'success' }

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // Detail panel
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSending, setNoteSending] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ ticketId: string; action: 'resolve' | 'reopen' } | null>(null)

  const fetchTickets = async () => {
    setIsLoading(true); setError(null)
    try {
      const data = await supportService.getTickets({ page, limit: pageSize, search: searchTerm || undefined, status: statusFilter === 'all' ? undefined : statusFilter })
      setTickets(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load tickets.')
    } finally { setIsLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [page, pageSize, searchTerm, statusFilter])

  const openDetail = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setNoteText('')
    setDetailLoading(true)
    try {
      const full = await supportService.getTicketById(ticket.id)
      setSelectedTicket(full ?? null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load ticket details.')
    }
    finally { setDetailLoading(false) }
  }

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      const updated = await supportService.updateTicketStatus(ticketId, status)
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t))
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated)
      toast.success('Status updated.')
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to update status.') }
  }

  const handleAddNote = async () => {
    if (!selectedTicket || !noteText.trim()) return
    setNoteSending(true)
    try {
      const updated = await supportService.addNote(selectedTicket.id, { content: noteText.trim() })
      setSelectedTicket(updated)
      setNoteText('')
      toast.success('Note added.')
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to add note.') }
    finally { setNoteSending(false) }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { ticketId, action } = confirmAction
    try {
      const updated = action === 'resolve'
        ? await supportService.updateTicketStatus(ticketId, 'resolved')
        : await supportService.reopenTicket(ticketId)
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t))
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated)
      toast.success(`Ticket ${action === 'reopen' ? 'reopened' : 'resolved'}.`)
    } catch (err: any) { toast.error('Action failed.') }
    finally { setConfirmAction(null) }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Manage support tickets, reply, add notes, and resolve issues." />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput placeholder="Search by ticket, subject, or email" value={searchTerm} onChange={e => { setPage(1); setSearchTerm(e.target.value) }} />
          </div>
          <select value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value as any) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <option value="all">All status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </FiltersBar>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`flex-1 min-w-0 transition-all ${selectedTicket ? 'lg:w-[55%]' : 'w-full'}`}>
          {isLoading ? <PageLoader rows={6} /> : error ? (
            <EmptyState title="Unable to load tickets" description={error} action={<button type="button" onClick={fetchTickets} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Retry</button>} />
          ) : tickets.length === 0 ? (
            <EmptyState title={hasFilters ? 'No tickets match' : 'No tickets yet'} description={hasFilters ? 'Adjust your filters.' : 'Tickets will appear here.'} />
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
                {tickets.map(ticket => (
                  <TableRow key={ticket.id} className={`cursor-pointer transition ${selectedTicket?.id === ticket.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`} onClick={() => openDetail(ticket)}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{ticket.ticketNumber}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ticket.subject}</p>
                        <p className="text-xs text-slate-400">{ticket.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm text-slate-600 capitalize">{ticket.category}</span></TableCell>
                    <TableCell><StatusBadge label={ticket.priority} variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'neutral'} className="capitalize" /></TableCell>
                    <TableCell><StatusBadge label={statusLabels[ticket.status]} variant={statusVariants[ticket.status]} /></TableCell>
                    <TableCell><span className="text-sm text-slate-600">{new Date(ticket.createdAt).toLocaleDateString()}</span></TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <select value={ticket.status} onChange={e => handleStatusChange(ticket.id, e.target.value as TicketStatus)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700">
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button type="button" onClick={() => openDetail(ticket)} className="rounded-lg border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && !error && tickets.length > 0 && (
            <div className="mt-4">
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={s => { setPage(1); setPageSize(s) }} />
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedTicket && (
          <div className="hidden lg:block w-[45%] shrink-0">
            <Card className="sticky top-4 border-slate-200/60 shadow-sm max-h-[calc(100vh-120px)] overflow-y-auto">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-5 w-5 text-indigo-500" />
                    {selectedTicket.ticketNumber}
                  </CardTitle>
                  <button type="button" onClick={() => setSelectedTicket(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {detailLoading ? <p className="text-sm text-slate-400 animate-pulse">Loading…</p> : (
                  <>
                    {/* User Info */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm"><User2 className="h-4 w-4 text-slate-400" /> <span className="font-semibold text-slate-900">{selectedTicket.userName || 'Unknown'}</span></div>
                      <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="h-3.5 w-3.5" /> {selectedTicket.email}</div>
                      {selectedTicket.userId && <Link to={`/users/${selectedTicket.userId}`} className="text-xs text-indigo-600 hover:underline">View user profile →</Link>}
                    </div>

                    {/* Ticket details */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge label={statusLabels[selectedTicket.status]} variant={statusVariants[selectedTicket.status]} />
                        <span className="text-xs text-slate-400">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Category: {selectedTicket.category}</p>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Subject: {selectedTicket.subject}</p>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Attachments</p>
                          {selectedTicket.attachments.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline block truncate">{url}</a>
                          ))}
                        </div>
                      )}
                      {selectedTicket.resolvedAt && (
                        <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Resolved on {new Date(selectedTicket.resolvedAt).toLocaleString()}</p>
                      )}
                    </div>

                    {/* Admin Notes / History */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <StickyNote className="h-4 w-4 text-amber-500" /> Internal Notes ({selectedTicket.notes?.length ?? 0})
                      </h4>
                      {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedTicket.notes.map((note, i) => (
                            <div key={i} className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-amber-700">{note.addedBy}</span>
                                <span className="text-[10px] text-amber-500">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</span>
                              </div>
                              <p className="text-sm text-slate-700">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-slate-400">No notes yet.</p>}
                    </div>

                    {/* Add Note */}
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-600">Add a Note</label>
                      <div className="flex gap-2">
                        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition resize-none" placeholder="Internal note, reply summary, or action taken…" />
                      </div>
                      <button type="button" onClick={handleAddNote} disabled={noteSending || !noteText.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <Send className="h-3.5 w-3.5" /> {noteSending ? 'Sending…' : 'Add Note'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Actions</p>
                      {selectedTicket.status !== 'resolved' && (
                        <button type="button" onClick={() => setConfirmAction({ ticketId: selectedTicket.id, action: 'resolve' })} className="flex w-full items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition">
                          <CheckCircle className="h-4 w-4" /> Mark as Resolved
                        </button>
                      )}
                      {selectedTicket.status === 'resolved' && (
                        <button type="button" onClick={() => setConfirmAction({ ticketId: selectedTicket.id, action: 'reopen' })} className="flex w-full items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition">
                          <RefreshCw className="h-4 w-4" /> Reopen Ticket
                        </button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={open => { if (!open) setConfirmAction(null) }}
        title={confirmAction?.action === 'resolve' ? 'Resolve this ticket?' : 'Reopen this ticket?'}
        description={confirmAction?.action === 'resolve' ? 'The ticket will be marked as resolved.' : 'The ticket will be reopened for further action.'}
        confirmText={confirmAction?.action === 'resolve' ? 'Resolve' : 'Reopen'}
        variant='default'
        onConfirm={handleConfirmAction}
      />
    </div>
  )
}
