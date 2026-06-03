import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Ban, CheckCircle, Eye, UserX, Download } from 'lucide-react'
import { usersService, type User } from '../lib/users'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { downloadCsvExport } from '../lib/export'

type UserStatus = 'active' | 'suspended'

const statusOptions: Array<{ label: string; value: 'all' | UserStatus }> = [
  { label: 'All status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
]

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmAction, setConfirmAction] = useState<{
    userId: string
    nextStatus: UserStatus
    name?: string
  } | null>(null)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await usersService.getUsers({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        role: 'USER',
      })
      setUsers(data.data)
      setTotal(data.pagination.total)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, searchTerm, statusFilter])

  const handleStatusChange = (user: User, nextStatus: UserStatus) => {
    setConfirmAction({ userId: user.id, nextStatus, name: user.name || user.email || user.phone })
  }

  const confirmStatusChange = async () => {
    if (!confirmAction) return
    const { userId, nextStatus } = confirmAction
    try {
      if (nextStatus === 'suspended') {
        await usersService.suspendUser(userId)
      } else {
        await usersService.activateUser(userId)
      }
      toast.success(`User ${nextStatus === 'suspended' ? 'suspended' : 'activated'} successfully.`)
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user))
      )
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update user status.')
    } finally {
      setConfirmAction(null)
    }
  }

  const handleExport = async () => {
    try {
      await downloadCsvExport('users')
      toast.success('Export started successfully')
    } catch (err) {
      toast.error('Failed to export users data')
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage platform users, verification, and access status."
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by name, email, or phone"
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
              setStatusFilter(event.target.value as 'all' | UserStatus)
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
          title="Unable to load users"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchUsers}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : users.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No users match your filters' : 'No users yet'}
          description={
            hasFilters
              ? 'Try adjusting your search or status filter.'
              : 'New users will appear here once they sign up.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{user.name || 'Unnamed User'}</p>
                    <p className="text-xs text-slate-500">ID: {user.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {user.email ? <p className="text-sm text-slate-700">{user.email}</p> : null}
                    <p className="text-sm text-slate-500">{user.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={user.status === 'active' ? 'Active' : 'Suspended'}
                    variant={user.status === 'active' ? 'success' : 'danger'}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-slate-700">
                    {user.bookingsCount ?? 0}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to={`/users/${user.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    {user.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(user, 'suspended')}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Ban className="h-4 w-4" />
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(user, 'active')}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Activate
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && users.length > 0 ? (
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
        title={
          confirmAction?.nextStatus === 'suspended'
            ? 'Suspend this user?'
            : 'Reactivate this user?'
        }
        description={
          confirmAction?.nextStatus === 'suspended'
            ? 'The user will lose access until reactivated.'
            : 'The user will regain access immediately.'
        }
        confirmText={confirmAction?.nextStatus === 'suspended' ? 'Suspend user' : 'Activate user'}
        variant={confirmAction?.nextStatus === 'suspended' ? 'danger' : 'default'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
