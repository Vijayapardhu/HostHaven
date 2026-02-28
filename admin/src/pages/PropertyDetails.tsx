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

type PropertyStatus = "approved" | "pending" | "rejected" | "inactive" | "deleted";

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<PropertyStatus | null>(
    null,
  );

  const fetchProperty = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await propertiesService.getPropertyById(id);
      setProperty(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Unable to load property details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const statusLabel = useMemo(() => {
    if (!property) return "";
    if (property.status === "approved") return "Approved";
    if (property.status === "pending") return "Pending";
    if (property.status === "rejected") return "Rejected";
    return "Inactive";
  }, [property]);

  const statusVariant = useMemo(() => {
    if (!property) return "neutral" as const;
    if (property.status === "approved") return "success" as const;
    if (property.status === "pending") return "warning" as const;
    if (property.status === "rejected") return "danger" as const;
    return "neutral" as const;
  }, [property]);

  const confirmStatusChange = async () => {
    if (!property || !confirmAction) return;
    try {
      if (confirmAction === "approved") {
        await propertiesService.approveProperty(property.id);
      } else if (confirmAction === "rejected") {
        await propertiesService.rejectProperty(property.id);
      } else if (confirmAction === "deleted") {
        await propertiesService.deleteProperty(property.id);
        toast.success("Property soft-deleted securely.");
        navigate("/properties");
        return;
      } else {
        await propertiesService.updateProperty(property.id, {
          status: confirmAction,
        });
      }
      setProperty({ ...property, status: confirmAction });
      toast.success("Property status updated.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update property status.",
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const toggleFeature = async () => {
    if (!property) return;
    try {
      const next = !property.isFeatured;
      await propertiesService.updateProperty(property.id, { isFeatured: next });
      setProperty({ ...property, isFeatured: next });
      toast.success(`Property ${next ? "featured" : "unfeatured"}.`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update property feature status.",
      );
    }
  };

  const toggleVerify = async () => {
    if (!property) return;
    try {
      const next = !property.isVerified;
      await propertiesService.updateProperty(property.id, { isVerified: next });
      setProperty({ ...property, isVerified: next });
      toast.success(`Property ${next ? "verified" : "unverified"}.`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update property verification status.",
      );
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
                to={`/properties/${property.id}/edit`}
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
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{property.city}</span>
                </div>
                {property.description ? <p>{property.description}</p> : null}
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
                        src={img}
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

          {property.rooms && property.rooms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mt-6">Room Inventory & Configuration</h3>
              {property.rooms.map((room) => (
                <RoomManagementCard key={room.id} room={room} onUpdate={fetchProperty} />
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
                    ₹{property.pricing?.basePrice?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Weekend price</span>
                  <span className="font-semibold text-slate-900">
                    ₹{property.pricing?.weekendPrice?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <CancellationPolicyCard
            propertyId={property.id}
            cancellationPolicy={property.cancellationPolicy}
            onUpdate={fetchProperty}
          />

          {property.type === 'home' && property.houseDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Home Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {property.houseDetails.houseType && (
                    <div className="flex justify-between"><span className="text-slate-500">House Type</span><span className="font-semibold text-slate-900">{property.houseDetails.houseType}</span></div>
                  )}
                  {property.houseDetails.listingType && (
                    <div className="flex justify-between"><span className="text-slate-500">Listing Type</span><span className="font-semibold text-slate-900">{property.houseDetails.listingType}</span></div>
                  )}
                  {property.houseDetails.viewType && (
                    <div className="flex justify-between"><span className="text-slate-500">View</span><span className="font-semibold text-slate-900">{property.houseDetails.viewType}</span></div>
                  )}
                  {property.houseDetails.totalGuests && (
                    <div className="flex justify-between"><span className="text-slate-500">Max Guests</span><span className="font-semibold text-slate-900">{property.houseDetails.totalGuests}</span></div>
                  )}
                  {property.houseDetails.bedrooms && (
                    <div className="flex justify-between"><span className="text-slate-500">Bedrooms</span><span className="font-semibold text-slate-900">{property.houseDetails.bedrooms}</span></div>
                  )}
                  {property.houseDetails.bathrooms && (
                    <div className="flex justify-between"><span className="text-slate-500">Bathrooms</span><span className="font-semibold text-slate-900">{property.houseDetails.bathrooms}</span></div>
                  )}
                  {property.houseDetails.checkInTime && (
                    <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span className="font-semibold text-slate-900">{property.houseDetails.checkInTime}</span></div>
                  )}
                  {property.houseDetails.checkOutTime && (
                    <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span className="font-semibold text-slate-900">{property.houseDetails.checkOutTime}</span></div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                  <button
                    type="button"
                    onClick={() => setConfirmAction("approved")}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 mb-2"
                  >
                    Approve property
                  </button>
                ) : null}

                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={toggleFeature}
                    className="w-full rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    {property.isFeatured ? "Remove Featured Tag" : "Mark as Featured"}
                  </button>

                  <button
                    type="button"
                    onClick={toggleVerify}
                    className="w-full rounded-lg bg-sky-50 border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    {property.isVerified ? "Remove Verification" : "Verify Property"}
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
          if (!open) setConfirmAction(null);
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
      />
    </div>
  );
}
