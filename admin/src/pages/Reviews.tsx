import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { reviewsService, type Review } from '../lib/reviews'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { PageLoader } from '../components/ui/PageLoader'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type ReviewStatus = 'approved' | 'pending' | 'rejected'

const statusLabels: Record<ReviewStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
}

const statusVariants: Record<ReviewStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchReviews = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewsService.getReviews({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setReviews(data.data ?? data.reviews ?? [])
      setTotal(data.pagination?.total ?? data.total ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load reviews.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [page, pageSize, searchTerm, statusFilter])

  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    try {
      if (status === 'approved') {
        await reviewsService.approveReview(reviewId)
      } else if (status === 'rejected') {
        await reviewsService.rejectReview(reviewId)
      }
      setReviews((prev) => prev.map((review) => (review.id === reviewId ? { ...review, status } : review)))
      toast.success('Review status updated.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update review.')
    }
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return
    try {
      await reviewsService.deleteReview(confirmDelete)
      setReviews((prev) => prev.filter((review) => review.id !== confirmDelete))
      toast.success('Review deleted successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to delete review.')
    } finally {
      setConfirmDelete(null)
    }
  }

  const hasFilters = useMemo(() => searchTerm.length > 0 || statusFilter !== 'all', [searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Moderate user reviews and manage approvals."
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by reviewer, title, or comment"
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
              setStatusFilter(event.target.value as 'all' | ReviewStatus)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load reviews"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchReviews}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No reviews match your filters' : 'No reviews yet'}
          description={hasFilters ? 'Try adjusting your search or status filter.' : 'Reviews will appear here.'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-900">{review.userName}</p>
                    <p className="text-xs text-slate-500">{review.propertyId}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-700">{review.rating} / 5</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{review.comment}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge label={statusLabels[review.status]} variant={statusVariants[review.status]} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{new Date(review.createdAt).toLocaleDateString()}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <select
                      value={review.status}
                      onChange={(event) => handleStatusChange(review.id, event.target.value as ReviewStatus)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(review.id)}
                      className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !error && reviews.length > 0 ? (
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
        title="Delete this review?"
        description="This action cannot be undone."
        confirmText="Delete review"
        variant="danger"
        onConfirm={confirmDeleteAction}
      />
    </div>
  )
}
