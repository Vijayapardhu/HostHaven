import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Ban, CheckCircle, Eye, Pencil, Star } from "lucide-react";
import { propertiesService, type Property } from "../lib/properties";
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

type PropertyStatus = "approved" | "pending" | "rejected" | "inactive";
type PropertyType = "hotel" | "home";

const statusOptions: Array<{ label: string; value: "all" | PropertyStatus }> = [
  { label: "All status", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
  { label: "Inactive", value: "inactive" },
];

const typeOptions: Array<{ label: string; value: "all" | PropertyType }> = [
  { label: "All types", value: "all" },
  { label: "Hotels", value: "hotel" },
  { label: "Homes", value: "home" },
];

const statusLabels: Record<PropertyStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  inactive: "Inactive",
};

const statusVariants: Record<
  PropertyStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  inactive: "neutral",
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | PropertyType>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{
    propertyId: string;
    nextStatus: PropertyStatus;
  } | null>(null);

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await propertiesService.getProperties({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
      });
      setProperties(data.data ?? data.properties ?? []);
      setTotal(data.pagination?.total ?? data.total ?? 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load properties.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, pageSize, searchTerm, statusFilter, typeFilter]);

  const handleStatusChange = (
    propertyId: string,
    nextStatus: PropertyStatus,
  ) => {
    setConfirmAction({ propertyId, nextStatus });
  };

  const confirmStatusChange = async () => {
    if (!confirmAction) return;
    const { propertyId, nextStatus } = confirmAction;
    try {
      if (nextStatus === "approved") {
        await propertiesService.approveProperty(propertyId);
      } else if (nextStatus === "rejected") {
        await propertiesService.rejectProperty(propertyId);
      } else {
        await propertiesService.updateProperty(propertyId, {
          status: nextStatus,
        });
      }
      setProperties((prev) =>
        prev.map((property) =>
          property.id === propertyId
            ? { ...property, status: nextStatus }
            : property,
        ),
      );
      toast.success("Property status updated.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update property status.",
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const hasFilters = useMemo(
    () =>
      searchTerm.length > 0 || statusFilter !== "all" || typeFilter !== "all",
    [searchTerm, statusFilter, typeFilter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage hotels and homes across all approved cities."
        actions={
          <div className="flex gap-2">
            <Link
              to="/properties/add"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
            >
              + Add Property
            </Link>
            <Link
              to="/properties/approval"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Pending approvals
            </Link>
          </div>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by property name, city, or address"
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as "all" | PropertyStatus);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => {
              setPage(1);
              setTypeFilter(event.target.value as "all" | PropertyType);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {typeOptions.map((option) => (
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
          title="Unable to load properties"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchProperties}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : properties.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "No properties match your filters"
              : "No properties yet"
          }
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Properties will appear here once created and approved."
          }
        />
      ) : (
        <>
          {/* Desktop - Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {property.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {property.address}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {property.type === "hotel" ? "Hotel" : "Home"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {property.city}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={statusLabels[property.status]}
                        variant={statusVariants[property.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-700">
                        <Star className="h-4 w-4 text-amber-500" />
                        {property.rating ?? 0}
                        <span className="text-xs text-slate-400">
                          ({property.reviewCount ?? 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/properties/${property.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <Link
                          to={`/properties/${property.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                        {property.status === "approved" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(property.id, "inactive")
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <Ban className="h-4 w-4" />
                            Deactivate
                          </button>
                        ) : property.status === "inactive" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(property.id, "approved")
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Activate
                          </button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile - Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {properties.map((property) => (
              <div
                key={property.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex gap-4">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={
                        typeof property.images[0] === "string"
                          ? property.images[0]
                          : property.images[0]?.url
                      }
                      alt={property.name}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <span className="text-xs">No img</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {property.city}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {property.type === "hotel" ? "Hotel" : "Home"}
                      </span>
                      <StatusBadge
                        label={statusLabels[property.status]}
                        variant={statusVariants[property.status]}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-slate-700">
                    <Star className="h-4 w-4 text-amber-500" />
                    {property.rating ?? 0}
                    <span className="text-xs text-slate-400">
                      ({property.reviewCount ?? 0})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/properties/${property.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    <Link
                      to={`/properties/${property.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {property.status === "approved" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(property.id, "inactive")
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    ) : property.status === "inactive" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(property.id, "approved")
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && properties.length > 0 ? (
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
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          confirmAction?.nextStatus === "inactive"
            ? "Deactivate this property?"
            : confirmAction?.nextStatus === "approved"
              ? "Activate this property?"
              : "Update property status?"
        }
        description={
          confirmAction?.nextStatus === "inactive"
            ? "The property will be hidden from listings."
            : "The property will be visible to users."
        }
        confirmText={
          confirmAction?.nextStatus === "inactive"
            ? "Deactivate property"
            : "Activate property"
        }
        variant={
          confirmAction?.nextStatus === "inactive" ? "danger" : "default"
        }
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
