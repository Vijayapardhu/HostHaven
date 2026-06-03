import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Star,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { propertiesService, type Property } from "../lib/properties";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { PageLoader } from "../components/ui/PageLoader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { RoomManagementCard } from "../components/properties/RoomManagementCard";
import { CancellationPolicyCard } from "../components/properties/CancellationPolicyCard";

type PropertyStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "inactive"
  | "draft"
  | "deleted";

type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError?.response?.data?.message || apiError?.message || fallback;
};

export default function PropertyDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<PropertyStatus | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchProperty = async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await propertiesService.getPropertyBySlug(slug);
      setProperty(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load property details."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [slug]);

  const statusLabel = useMemo(() => {
    if (!property) return "";
    if (property.status === "approved") return "Approved";
    if (property.status === "pending") return "Pending";
    if (property.status === "rejected") return "Rejected";
    if (property.status === "draft") return "Draft";
    return "Inactive";
  }, [property]);

  const statusVariant = useMemo(() => {
    if (!property) return "neutral" as const;
    if (property.status === "approved") return "success" as const;
    if (property.status === "pending") return "warning" as const;
    if (property.status === "rejected") return "danger" as const;
    if (property.status === "draft") return "neutral" as const;
    return "neutral" as const;
  }, [property]);

  const videoUrls = Array.isArray(property?.videos)
    ? property.videos
        ?.map((video: any) => (typeof video === "string" ? video : video?.url))
        .filter(Boolean)
    : [];

  const houseDetails = property?.houseDetails && typeof property.houseDetails === 'object'
    ? property.houseDetails as Record<string, unknown>
    : {};

  const getDetailValue = (key: string) => {
    const value = houseDetails[key];
    if (value === undefined || value === null || value === '') return null;
    return String(value);
  };

  const confirmStatusChange = async () => {
    if (!property || !confirmAction) return;
    try {
      if (confirmAction === "approved") {
        await propertiesService.approveProperty(property.slug);
      } else if (confirmAction === "rejected") {
        if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
          toast.error('Please provide a detailed rejection reason.');
          return;
        }
        await propertiesService.rejectProperty(property.slug, rejectionReason.trim());
      } else if (confirmAction === "deleted") {
        await propertiesService.deleteProperty(property.slug);
        toast.success("Property soft-deleted securely.");
        navigate("/properties");
        return;
      } else {
        await propertiesService.updateProperty(property.slug, {
          status: confirmAction,
        });
      }
      setProperty({
        ...property,
        status: confirmAction,
        rejectionReason:
          confirmAction === 'rejected'
            ? rejectionReason.trim()
            : confirmAction === 'approved'
              ? null
              : property.rejectionReason,
      });
      toast.success("Property status updated.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update property status."));
    } finally {
      setConfirmAction(null);
      setRejectionReason('');
    }
  };

  const toggleFeature = async () => {
    if (!property) return;
    try {
      const next = !property.isFeatured;
      await propertiesService.updateProperty(property.slug, { isFeatured: next });
      setProperty({ ...property, isFeatured: next });
      toast.success(`Property ${next ? "featured" : "unfeatured"}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update property feature status."));
    }
  };

  const toggleVerify = async () => {
    if (!property) return;
    try {
      const next = !property.isVerified;
      await propertiesService.updateProperty(property.slug, { isVerified: next });
      setProperty({ ...property, isVerified: next });
      toast.success(`Property ${next ? "verified" : "unverified"}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update property verification status."));
    }
  };

  if (isLoading) {
    return <PageLoader rows={6} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load property"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchProperty}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!property) {
    return (
      <EmptyState
        title="Property not found"
        description="This property record does not exist."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/properties")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={property.name}
          description={property.address}
          actions={
            <div className="flex items-center gap-2">
              {property.isFeatured && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  Featured
                </span>
              )}
              {property.isVerified && (
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  Verified
                </span>
              )}
              <StatusBadge label={statusLabel} variant={statusVariant} />
              <Link
                to={`/properties/${property.slug}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Slug</span>
                  <span className="font-semibold text-slate-900">{property.slug || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{property.city}</span>
                </div>
                {property.shortDesc ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                    {property.shortDesc}
                  </p>
                ) : null}
                {property.description ? <p>{property.description}</p> : null}
                {property.searchText ? (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Search Text</p>
                    <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-600">
                      {property.searchText}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              {(property.images ?? []).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {property.images?.map((img, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      <img
                        src={typeof img === "string" ? img : img.url}
                        alt={`Property ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-8">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">
                      No images uploaded yet
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(property.amenities ?? []).length > 0 ? (
                  property.amenities?.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {amenity}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No amenities listed yet.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Highlights And Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {(property.highlights ?? []).length > 0 ? (
                    property.highlights?.map((highlight) => (
                      <span key={highlight} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {highlight}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No highlights recorded.</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Video URLs</p>
                {videoUrls.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {videoUrls.map((videoUrl) => (
                      <a key={videoUrl} href={videoUrl} target="_blank" rel="noreferrer" className="block break-all text-indigo-600 hover:text-indigo-700">
                        {videoUrl}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">No videos linked.</span>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Virtual Tour</p>
                {property.virtualTourUrl ? (
                  <a href={property.virtualTourUrl} target="_blank" rel="noreferrer" className="break-all text-sm text-indigo-600 hover:text-indigo-700">
                    {property.virtualTourUrl}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">No virtual tour linked.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {property.rooms && property.rooms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mt-6">
                Room Inventory & Configuration
              </h3>
              {property.rooms.filter((room) => Boolean(room.id)).map((room) => (
                <RoomManagementCard
                  key={room.id}
                  room={{ ...room, id: room.id! }}
                  onUpdate={fetchProperty}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rating</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-900">
                    <Star className="h-4 w-4 text-amber-500" />
                    {property.rating ?? 0} ({property.reviewCount ?? 0})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Base price</span>
                  <span className="font-semibold text-slate-900">
                    ₹{property.basePrice?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bookings</span>
                  <span className="font-semibold text-slate-900">
                    {property.bookingCount ?? property.bookingsCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Views</span>
                  <span className="font-semibold text-slate-900">{property.viewCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Currency</span>
                  <span className="font-semibold text-slate-900">{property.currency ?? "INR"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Vendor ID</span>
                  <span className="font-semibold text-slate-900">{property.vendorId ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Meta Title</span>
                  <span className="font-semibold text-slate-900 text-right">{property.metaTitle || "—"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Meta Description</span>
                  <span className="font-semibold text-slate-900 text-right">{property.metaDesc || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <CancellationPolicyCard
            propertyId={property.id}
            cancellationPolicy={property.cancellationPolicy ? {
              id: property.cancellationPolicy.id || property.id,
              freeBeforeHours: property.cancellationPolicy.freeBeforeHours,
              refundPercentBefore: property.cancellationPolicy.refundPercentBefore,
              refundPercentAfter: property.cancellationPolicy.refundPercentAfter,
            } : null}
            onUpdate={fetchProperty}
          />

          {property.type === "home" && Object.keys(houseDetails).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Home Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {getDetailValue('houseType') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">House Type</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('houseType')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('listingType') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Listing Type</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('listingType')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('viewType') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">View</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('viewType')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('totalGuests') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Guests</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('totalGuests')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('bedrooms') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bedrooms</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('bedrooms')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('bathrooms') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bathrooms</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('bathrooms')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('checkInTime') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-in</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('checkInTime')}
                      </span>
                    </div>
                  )}
                  {getDetailValue('checkOutTime') && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Check-out</span>
                      <span className="font-semibold text-slate-900">
                        {getDetailValue('checkOutTime')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {property.featureFlags ? (
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(property.featureFlags, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          {property.templeDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>Temple Details</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(property.templeDetails, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {property.status === "approved" ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("inactive")}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 mb-2"
                  >
                    Deactivate property
                  </button>
                ) : property.status === "inactive" ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("approved")}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 mb-2"
                  >
                    Activate property
                  </button>
                ) : property.status === "pending" ? (
                  <div className="grid gap-2 mb-2">
                    <Link
                      to={`/properties/${property.slug}/edit`}
                      className="w-full rounded-lg border border-amber-200 px-4 py-2 text-center text-sm font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Review full property
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmAction("approved")}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve property
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction("rejected")}
                      className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject property
                    </button>
                  </div>
                ) : property.status === "rejected" ? (
                  <div className="grid gap-2 mb-2">
                    {property.rejectionReason ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                        <p className="font-semibold">Latest rejection reason</p>
                        <p className="mt-1">{property.rejectionReason}</p>
                      </div>
                    ) : null}
                    <Link
                      to={`/properties/${property.slug}/edit`}
                      className="w-full rounded-lg border border-amber-200 px-4 py-2 text-center text-sm font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      Review full property
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmAction("approved")}
                      className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      Approve property
                    </button>
                  </div>
                ) : null}

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={toggleFeature}
                    className="w-full rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    {property.isFeatured
                      ? "Remove Featured Tag"
                      : "Mark as Featured"}
                  </button>

                  <button
                    type="button"
                    onClick={toggleVerify}
                    className="w-full rounded-lg bg-sky-50 border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    {property.isVerified
                      ? "Remove Verification"
                      : "Verify Property"}
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setConfirmAction("deleted")}
                    className="w-full rounded-lg bg-rose-50 border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100 hover:border-rose-300"
                  >
                    Soft Delete Property
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setRejectionReason('');
          }
        }}
        title={
          confirmAction === "inactive"
            ? "Deactivate this property?"
            : confirmAction === "approved"
              ? "Approve this property?"
              : confirmAction === "deleted"
                ? "Soft Delete this property?"
                : "Reject this property?"
        }
        description={
          confirmAction === "inactive"
            ? "The property will be hidden from listings."
            : confirmAction === "approved"
              ? "The property will go live for users."
              : confirmAction === "deleted"
                ? "The property will be safely soft-deleted from the platform preventing further active interactions."
                : "The property will be rejected."
        }
        confirmText={
          confirmAction === "inactive"
            ? "Deactivate property"
            : confirmAction === "approved"
              ? "Approve property"
              : confirmAction === "deleted"
                ? "Delete property"
                : "Reject property"
        }
        variant={confirmAction === "approved" ? "default" : "danger"}
        onConfirm={confirmStatusChange}
      >
        {confirmAction === 'rejected' ? (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Explain why this property is being rejected..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
