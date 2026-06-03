import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Star,
  EyeOff,
  Eye,
  CheckCircle,
  Trash2,
  X,
  MessageSquare,
  MapPin,
  Edit3,
} from "lucide-react";
import { reviewsService, type Review } from "../lib/reviews";
import { FiltersBar } from "../components/ui/FiltersBar";
import { PageHeader } from "../components/ui/PageHeader";
import { SearchInput } from "../components/ui/SearchInput";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { PageLoader } from "../components/ui/PageLoader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import * as Dialog from "@radix-ui/react-dialog";

type ReviewStatus = "approved" | "pending" | "hidden" | "all";

const statusLabels: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  hidden: "Hidden",
  rejected: "Hidden",
};
const statusVariants: Record<string, "success" | "warning" | "neutral"> = {
  approved: "success",
  pending: "warning",
  hidden: "neutral",
  rejected: "neutral",
};

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Detail panel state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    id: string;
    action: "delete" | "hide" | "unhide" | "verify";
  } | null>(null);

  // Edit abusive content state
  const [editContent, setEditContent] = useState<{
    open: boolean;
    title: string;
    comment: string;
  } | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reviewsService.getReviews({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setReviews(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, pageSize, searchTerm, statusFilter]);

  const openDetail = async (review: Review) => setSelectedReview(review);

  const handleAction = async () => {
    if (!actionConfirm) return;
    const { id, action } = actionConfirm;
    try {
      if (action === "delete") {
        await reviewsService.deleteReview(id);
        setReviews((prev) => prev.filter((r) => r.id !== id));
        if (selectedReview?.id === id) setSelectedReview(null);
      } else if (action === "hide") {
        const updated = await reviewsService.hideReview(id);
        updateLocalReview(updated);
      } else if (action === "unhide") {
        const updated = await reviewsService.unhideReview(id);
        updateLocalReview(updated);
      } else if (action === "verify") {
        const updated = await reviewsService.verifyReview(id);
        updateLocalReview(updated);
      }
      toast.success(
        `Review ${action === "delete" ? "deleted" : action === "hide" ? "hidden" : action === "unhide" ? "unhidden" : "verified"}.`,
      );
    } catch (err: any) {
      toast.error("Failed to perform action.");
    } finally {
      setActionConfirm(null);
    }
  };

  const updateLocalReview = (updated: Review) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedReview?.id === updated.id) setSelectedReview(updated);
  };

  const handleUpdateContent = async () => {
    if (!selectedReview || !editContent) return;
    try {
      const updated = await reviewsService.updateReviewContent(
        selectedReview.id,
        {
          title: editContent.title,
          comment: editContent.comment,
        },
      );
      updateLocalReview(updated);
      toast.success("Review content updated.");
      setEditContent(null);
    } catch (err: any) {
      toast.error("Failed to update review content.");
    }
  };

  const openEditContent = (review: Review) => {
    setEditContent({
      open: true,
      title: review.title,
      comment: review.comment,
    });
  };

  const approveAndUnhide = async (id: string) => {
    try {
      const updated = await reviewsService.approveReview(id);
      updateLocalReview(updated);
      toast.success("Review approved and visible.");
    } catch {
      toast.error("Failed to approve review.");
    }
  };

  const hasFilters = useMemo(
    () => searchTerm.length > 0 || statusFilter !== "all",
    [searchTerm, statusFilter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Moderate user reviews, manage visibility, and verify feedback."
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by name, property, or text"
              value={searchTerm}
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as ReviewStatus);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All Reviews</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </FiltersBar>

      <div className="flex gap-6">
        {/* Table Panel */}
        <div
          className={`flex-1 min-w-0 transition-all ${selectedReview ? "lg:w-[55%]" : "w-full"}`}
        >
          {isLoading ? (
            <PageLoader rows={8} />
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
              title={hasFilters ? "No reviews match" : "No reviews"}
              description="No reviews found for these criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className={`cursor-pointer transition ${selectedReview?.id === review.id ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}
                    onClick={() => openDetail(review)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.userName}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">
                          {review.propertyName || review.propertyId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        {review.rating.toFixed(1)}{" "}
                        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                        {review.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">
                        {review.comment}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={statusLabels[review.status]}
                        variant={statusVariants[review.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && !error && reviews.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPage(1);
                  setPageSize(s);
                }}
              />
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedReview && (
          <div className="hidden lg:block w-[45%] shrink-0">
            <Card className="sticky top-4 border-slate-200/60 shadow-sm max-h-[calc(100vh-120px)] overflow-y-auto">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Review Details
                    <StatusBadge
                      label={statusLabels[selectedReview.status]}
                      variant={statusVariants[selectedReview.status]}
                    />
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                {/* Meta block */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {selectedReview.userName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(selectedReview.createdAt).toLocaleString()}
                    </p>
                    <Link
                      to={`/users/${selectedReview.userId}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      View User Profile →
                    </Link>
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <p className="font-semibold text-slate-900 flex items-center justify-end gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />{" "}
                      {selectedReview.propertyName || selectedReview.propertyId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedReview.propertyCity}{" "}
                      {selectedReview.propertyType &&
                        `• ${selectedReview.propertyType}`}
                    </p>
                  </div>
                </div>

                {/* Score block */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center bg-amber-100 text-amber-700 h-10 w-10 font-bold rounded-lg text-lg">
                      {selectedReview.rating.toFixed(1)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Overall Score
                      </h4>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            className={`h-4 w-4 ${v <= selectedReview.rating ? "fill-amber-400 text-amber-500" : "fill-slate-100 text-slate-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Cleanliness</span>
                      <span className="font-medium">
                        {selectedReview.cleanliness || "-"} / 5
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Service</span>
                      <span className="font-medium">
                        {selectedReview.service || "-"} / 5
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Location</span>
                      <span className="font-medium">
                        {selectedReview.location || "-"} / 5
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Value</span>
                      <span className="font-medium">
                        {selectedReview.value || "-"} / 5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-2">
                    {selectedReview.title}
                  </h4>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    "{selectedReview.comment}"
                  </div>
                </div>

                {/* Vendor response */}
                {selectedReview.vendorResponse && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-800 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> Vendor Reply
                    </p>
                    <p className="text-sm text-indigo-900 mt-1">
                      {selectedReview.vendorResponse}
                    </p>
                    <p className="text-xs text-indigo-400 mt-2">
                      {selectedReview.respondedAt
                        ? new Date(
                            selectedReview.respondedAt,
                          ).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-slate-100 pt-5 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Moderation Actions
                  </p>

                  {selectedReview.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => approveAndUnhide(selectedReview.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve & Verify
                    </button>
                  )}

                  {selectedReview.isVisible ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActionConfirm({
                          id: selectedReview.id,
                          action: "hide",
                        })
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <EyeOff className="h-4 w-4 text-amber-500" /> Hide from
                      Public
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setActionConfirm({
                          id: selectedReview.id,
                          action: "unhide",
                        })
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Eye className="h-4 w-4 text-emerald-500" /> Unhide (Make
                      Public)
                    </button>
                  )}

                  {!selectedReview.isVerified &&
                    selectedReview.status !== "pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          setActionConfirm({
                            id: selectedReview.id,
                            action: "verify",
                          })
                        }
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        <CheckCircle className="h-4 w-4" /> Verify Stay
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => openEditContent(selectedReview)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition"
                  >
                    <Edit3 className="h-4 w-4" /> Edit / Remove Abusive Content
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActionConfirm({
                        id: selectedReview.id,
                        action: "delete",
                      })
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition mt-4"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Review
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(actionConfirm)}
        onOpenChange={(open) => {
          if (!open) setActionConfirm(null);
        }}
        title={
          actionConfirm?.action === "delete"
            ? "Delete review?"
            : actionConfirm?.action === "hide"
              ? "Hide review?"
              : actionConfirm?.action === "unhide"
                ? "Unhide review?"
                : "Verify review?"
        }
        description={
          actionConfirm?.action === "delete"
            ? "This removes the review from the platform completely."
            : actionConfirm?.action === "hide"
              ? "The review will no longer be visible to users."
              : actionConfirm?.action === "unhide"
                ? "The review will be visible to everyone."
                : "This marks the review as a verified stay."
        }
        confirmText={actionConfirm?.action === "delete" ? "Delete" : "Confirm"}
        variant={actionConfirm?.action === "delete" ? "danger" : "default"}
        onConfirm={handleAction}
      />

      {/* Edit Content Dialog */}
      <Dialog.Root
        open={editContent?.open}
        onOpenChange={(open) => {
          if (!open) setEditContent(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Edit Review Content
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Remove or edit abusive/inappropriate content from this review.
            </Dialog.Description>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editContent?.title ?? ""}
                  onChange={(e) =>
                    setEditContent((prev) =>
                      prev ? { ...prev, title: e.target.value } : null,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={editContent?.comment ?? ""}
                  onChange={(e) =>
                    setEditContent((prev) =>
                      prev ? { ...prev, comment: e.target.value } : null,
                    )
                  }
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditContent(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateContent}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Save Changes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
