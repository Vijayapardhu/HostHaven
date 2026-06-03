import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { templesService, type Temple } from "../lib/temples";
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
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ImportExportButtons } from "../components/ui/ImportExportButtons";

export default function Temples() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Temple | null>(null);

  const getTempleImageUrl = (image: Temple["images"] extends Array<infer T>
    ? T
    : never) => {
    if (!image) return "";
    return typeof image === "string" ? image : image.url || "";
  };

  const fetchTemples = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await templesService.getTemples({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        active:
          statusFilter === "all"
            ? undefined
            : statusFilter === "active",
      });
      setTemples(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load temples.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemples();
  }, [page, pageSize, searchTerm, statusFilter]);

  const toggleActive = async (temple: Temple) => {
    try {
      if (temple.active) {
        await templesService.deactivateTemple(temple.slug);
      } else {
        await templesService.activateTemple(temple.slug);
      }
      setTemples((prev) =>
        prev.map((item) =>
          item.id === temple.id ? { ...item, active: !temple.active } : item,
        ),
      );
      toast.success(
        `Temple ${temple.active ? "deactivated" : "activated"} successfully.`,
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update temple status.",
      );
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await templesService.deleteTemple(confirmDelete.slug);
      setTemples((prev) =>
        prev.filter((temple) => temple.id !== confirmDelete.id),
      );
      toast.success("Temple deleted successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unable to delete temple.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const hasFilters = useMemo(
    () => searchTerm.length > 0 || statusFilter !== "all",
    [searchTerm, statusFilter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Temples"
        description="Temples are content-only listings (no bookings or payments)."
        actions={
          <div className="flex items-center gap-3">
            <ImportExportButtons 
              entity="temples" 
              onImportComplete={() => fetchTemples()}
            />
            <Link
              to="/temples/new"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add temple
            </Link>
          </div>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            containerClassName="w-full md:max-w-md"
            placeholder="Search by temple name or city"
            value={searchTerm}
            onChange={(event) => {
              setPage(1);
              setSearchTerm(event.target.value);
            }}
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(
                event.target.value as "all" | "active" | "inactive",
              );
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 md:w-48"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load temples"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchTemples}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : temples.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No temples match your search" : "No temples yet"}
          description={
            hasFilters
              ? "Try adjusting your search."
              : "Create a temple listing to get started."
          }
        />
      ) : (
        <>
          {/* Desktop - Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Temple</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {temples.map((temple) => (
                  <TableRow key={temple.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getTempleImageUrl(temple.images?.[0]) ? (
                          <img
                            src={getTempleImageUrl(temple.images?.[0])}
                            alt={temple.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <span className="text-xs">No img</span>
                          </div>
                        )}
                        <p className="font-semibold text-slate-900">
                          {temple.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {temple.city}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={temple.active ? "Active" : "Inactive"}
                        variant={temple.active ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/temples/${temple.slug}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </Link>
                        <Link
                          to={`/temples/${temple.slug}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleActive(temple)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                        >
                          {temple.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                           onClick={() => setConfirmDelete(temple)}
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
          </div>

          {/* Mobile - Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {temples.map((temple) => (
              <div
                key={temple.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex gap-4">
                  {getTempleImageUrl(temple.images?.[0]) ? (
                    <img
                      src={getTempleImageUrl(temple.images?.[0])}
                      alt={temple.name}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <span className="text-xs">No img</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">
                      {temple.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{temple.city}</p>
                    <div className="mt-2">
                      <StatusBadge
                        label={temple.active ? "Active" : "Inactive"}
                        variant={temple.active ? "success" : "neutral"}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/temples/${temple.slug}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </Link>
                  <Link
                    to={`/temples/${temple.slug}/edit`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleActive(temple)}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                  >
                    {temple.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(temple)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && temples.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1);
            setPageSize(size);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete this temple?"
        description="This action cannot be undone."
        confirmText="Delete temple"
        variant="danger"
        onConfirm={confirmDeleteAction}
      />
    </div>
  );
}
