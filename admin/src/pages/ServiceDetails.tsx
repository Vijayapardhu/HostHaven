import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Activity,
} from "lucide-react";
import { servicesService, type Service } from "../lib/services";
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

const categoryLabels: Record<string, string> = {
  transport: "Transport",
  guide: "Guide",
  photography: "Photography",
  food: "Food & Dining",
  other: "Other",
};

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);

  const fetchService = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await servicesService.getServiceById(id);
      setService(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Unable to load service details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [id]);

  const confirmStatusChange = async () => {
    if (!service || !confirmAction) return;
    try {
      if (confirmAction === "activate") {
        await servicesService.activateService(service.id);
        setService({ ...service, active: true });
        toast.success("Service activated successfully.");
      } else {
        await servicesService.deactivateService(service.id);
        setService({ ...service, active: false });
        toast.success("Service deactivated successfully.");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update service status.",
      );
    } finally {
      setConfirmAction(null);
    }
  };

  if (isLoading) {
    return <PageLoader rows={6} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load service"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchService}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!service) {
    return (
      <EmptyState
        title="Service not found"
        description="This service record does not exist."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/services")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={service.name}
          description={categoryLabels[service.category] || service.category}
          actions={
            <StatusBadge
              label={service.active ? "Active" : "Inactive"}
              variant={service.active ? "success" : "neutral"}
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Category:</span>{" "}
                  {categoryLabels[service.category] || service.category}
                </div>
                {service.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium text-slate-900 mb-2">
                      Description
                    </p>
                    <p className="text-slate-600 whitespace-pre-wrap">
                      {service.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Images</CardTitle>
            </CardHeader>
            <CardContent>
              {(service.images ?? []).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {service.images?.map((img, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      <img
                        src={img}
                        alt={`Service ${index + 1}`}
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    Base Price
                  </span>
                  <span className="font-semibold text-slate-900">
                    ₹{service.basePrice.toLocaleString()}
                  </span>
                </div>
                {service.advanceValue !== undefined &&
                  service.advanceValue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        Advance
                      </span>
                      <span className="font-semibold text-slate-900">
                        {service.advanceType === "percentage"
                          ? `${service.advanceValue}%`
                          : `₹${service.advanceValue}`}
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/services/${service.id}/edit`)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit Service
                </button>
                {service.active ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("deactivate")}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Deactivate Service
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("activate")}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    Activate Service
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-slate-500">
                <p>
                  Created: {new Date(service.createdAt).toLocaleDateString()}
                </p>
                <p>
                  Updated: {new Date(service.updatedAt).toLocaleDateString()}
                </p>
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
          confirmAction === "activate"
            ? "Activate this service?"
            : "Deactivate this service?"
        }
        description={
          confirmAction === "activate"
            ? "The service will be available for booking."
            : "The service will be hidden from listings."
        }
        confirmText={
          confirmAction === "activate"
            ? "Activate service"
            : "Deactivate service"
        }
        variant={confirmAction === "activate" ? "default" : "danger"}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
