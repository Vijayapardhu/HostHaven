import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Wallet, Eye, Building2, MapPin, Edit, Shield, User, Bed, Calendar } from "lucide-react";
import { vendorsService, type Vendor } from "../lib/vendors";
import { propertiesService, type Property } from "../lib/properties";
import { bookingsService, type Booking } from "../lib/bookings";
import { EditVendorModal } from "../components/vendors/EditVendorModal";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";

const propertyStatusLabels: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  inactive: "Inactive",
};

const propertyStatusVariants: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  inactive: "neutral",
};

const bookingStatusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked-in",
  checked_out: "Checked-out",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const bookingStatusVariants: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  pending: "warning",
  confirmed: "success",
  checked_in: "info",
  checked_out: "neutral",
  cancelled: "danger",
  refunded: "neutral",
};

const paymentVariants: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  completed: "success",
  pending: "warning",
  refunded: "neutral",
  failed: "danger",
};



const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "suspended" | "approved" | "rejected" | "deleted" | null
  >(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchVendor = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [vendorData, propertiesData, bookingsData] = await Promise.all([
        vendorsService.getVendorById(id),
        propertiesService.getProperties({ vendorId: id, limit: 50 }),
        bookingsService.getBookings({ vendorId: id, limit: 50 })
      ]);

      if (vendorData) {
        setVendor(vendorData);
        setCommissionRate(String(vendorData.commissionRate ?? ""));
        setProperties(propertiesData.data ?? []);
        setBookings(bookingsData.data ?? []);
      } else {
        throw new Error("Vendor not found");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Unable to load vendor details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const statusLabel = useMemo(() => {
    if (!vendor) return "";
    if (vendor.status === "approved") return "Approved";
    if (vendor.status === "pending") return "Pending";
    if (vendor.status === "rejected") return "Rejected";
    return "Suspended";
  }, [vendor]);

  const statusVariant = useMemo(() => {
    if (!vendor) return "neutral" as const;
    if (vendor.status === "approved") return "success" as const;
    if (vendor.status === "pending") return "warning" as const;
    if (vendor.status === "rejected") return "danger" as const;
    return "danger" as const;
  }, [vendor]);

  const confirmStatusChange = async () => {
    if (!vendor || !confirmAction) return;
    try {
      if (confirmAction === "suspended") {
        await vendorsService.suspendVendor(vendor.id);
        setVendor({ ...vendor, status: "suspended", applicationStatus: "SUSPENDED" });
        toast.success("Vendor suspended successfully.");
      } else if (confirmAction === "rejected") {
        if (!rejectReason || rejectReason.trim().length < 10) {
          toast.error("Please provide a detailed rejection reason.");
          return;
        }
        await vendorsService.rejectVendor(vendor.id, rejectReason);
        setVendor({
          ...vendor,
          status: "rejected",
          applicationStatus: "REJECTED",
          rejectionReason: rejectReason,
        });
        toast.success("Vendor rejected successfully.");
      } else if (confirmAction === "deleted") {
        await vendorsService.deleteVendor(vendor.id);
        toast.success("Vendor soft deleted successfully.");
        navigate("/vendors");
      } else {
        await vendorsService.activateVendor(vendor.id);
        setVendor({ ...vendor, status: "approved", applicationStatus: "APPROVED", rejectionReason: undefined });
        toast.success("Vendor reactivated successfully.");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update vendor status.",
      );
    } finally {
      setConfirmAction(null);
      setRejectReason("");
    }
  };

  const handleCommissionSave = async () => {
    if (!vendor) return;
    const value = Number(commissionRate);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Commission rate must be between 0 and 100.");
      return;
    }
    setCommissionLoading(true);
    try {
      await vendorsService.setCommission(vendor.id, value);
      setVendor({ ...vendor, commissionRate: value });
      toast.success("Commission updated successfully.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update commission.",
      );
    } finally {
      setCommissionLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoader rows={6} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load vendor"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchVendor}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!vendor) {
    return (
      <EmptyState
        title="Vendor not found"
        description="This vendor record does not exist."
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20"
    >
      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={() => navigate("/vendors")}
          className="inline-flex items-center gap-2 rounded-xl bg-white/50 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
      >
        <div className="h-32 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:h-48" />

        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-12 mb-6 flex flex-col items-start gap-6 sm:-mt-16 sm:flex-row sm:items-end">
            <div className="relative group">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:h-32 sm:w-32">
                {vendor.companyLogo ? (
                  <img
                    src={vendor.companyLogo}
                    className="h-full w-full object-cover"
                    alt="Company Logo"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-slate-300" />
                )}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {vendor.businessName}
                </h1>
                <StatusBadge label={statusLabel} variant={statusVariant} />
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {vendor.businessAddress || "No address provided"}
              </p>
            </div>

            <div className="pb-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Properties</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {vendor.propertiesCount ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Bookings</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {bookings.length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Commission</p>
              <div className="mt-1 flex items-center gap-1">
                <p className="text-xl font-bold text-slate-900">
                  {vendor.commissionRate}%
                </p>
                <Wallet className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Joined</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {new Date(vendor.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Earnings</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                ₹{Number(vendor.totalEarnings || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="space-y-6 lg:col-span-1">
          <Card className="border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <User className="h-4 w-4 text-blue-500" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {vendor.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {vendor.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="h-4 w-4 text-emerald-500" />
                Identity & Tax
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {vendor.passportPhoto && (
                <div className="mb-4 flex items-center gap-4">
                  <img
                    src={vendor.passportPhoto}
                    className="h-16 w-16 rounded-lg border object-cover"
                    alt="Passport"
                  />
                  <div className="text-sm font-medium text-slate-700">
                    Passport / ID
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">GST Number</p>
                <p className="rounded-md border border-slate-100 bg-slate-50 p-2 text-sm font-medium font-mono text-slate-900">
                  {vendor.gstNumber || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">PAN Number</p>
                <p className="rounded-md border border-slate-100 bg-slate-50 p-2 text-sm font-medium font-mono text-slate-900">
                  {vendor.panNumber || "Not provided"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Aadhaar</p>
                <p className="rounded-md border border-slate-100 bg-slate-50 p-2 text-sm font-medium font-mono text-slate-900">
                  {vendor.aadhaarNumber || "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {(vendor.businessDocuments?.gstCertificate || vendor.businessDocuments?.panCard || vendor.businessDocuments?.aadhaarCard || vendor.businessDocuments?.bankPassbook || vendor.businessDocuments?.businessProof) && (
            <Card className="border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Business Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {vendor.businessDocuments?.gstCertificate && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">GST Certificate</p>
                    <a href={vendor.businessDocuments.gstCertificate} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition">
                      <img src={vendor.businessDocuments.gstCertificate} alt="GST Certificate" className="h-20 w-full object-cover rounded" />
                    </a>
                  </div>
                )}
                {vendor.businessDocuments?.panCard && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">PAN Card</p>
                    <a href={vendor.businessDocuments.panCard} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition">
                      <img src={vendor.businessDocuments.panCard} alt="PAN Card" className="h-20 w-full object-cover rounded" />
                    </a>
                  </div>
                )}
                {vendor.businessDocuments?.aadhaarCard && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Aadhaar Card</p>
                    <a href={vendor.businessDocuments.aadhaarCard} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition">
                      <img src={vendor.businessDocuments.aadhaarCard} alt="Aadhaar Card" className="h-20 w-full object-cover rounded" />
                    </a>
                  </div>
                )}
                {vendor.businessDocuments?.bankPassbook && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Bank Passbook</p>
                    <a href={vendor.businessDocuments.bankPassbook} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition">
                      <img src={vendor.businessDocuments.bankPassbook} alt="Bank Passbook" className="h-20 w-full object-cover rounded" />
                    </a>
                  </div>
                )}
                {vendor.businessDocuments?.businessProof && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Business Proof</p>
                    <a href={vendor.businessDocuments.businessProof} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition">
                      <img src={vendor.businessDocuments.businessProof} alt="Business Proof" className="h-20 w-full object-cover rounded" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Wallet className="h-4 w-4 text-amber-500" />
                Payout Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Bank Name</p>
                <p className="text-sm font-medium text-slate-900">
                  {vendor.payoutDetails?.bankName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Account Number
                </p>
                <p className="text-sm font-mono text-slate-900">
                  {vendor.payoutDetails?.bankAccount || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">IFSC Code</p>
                <p className="text-sm font-mono text-slate-900">
                  {vendor.payoutDetails?.ifsc || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="h-4 w-4 text-rose-500" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">
                  Commission Rate
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={commissionRate}
                      onChange={(event) => setCommissionRate(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCommissionSave}
                    disabled={commissionLoading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {commissionLoading ? "..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                {vendor.status === "approved" ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("suspended")}
                    className="w-full rounded-lg border border-rose-200 bg-rose-50/50 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100"
                  >
                    Suspend Account
                  </button>
                ) : vendor.status === "suspended" ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("approved")}
                    className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-100"
                  >
                    Reactivate Account
                  </button>
                ) : vendor.status === "pending" || vendor.status === "rejected" ? (
                  <div className="mb-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction("approved")}
                      className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-100"
                    >
                      Approve Vendor
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction("rejected")}
                      className="w-full rounded-lg border border-rose-200 bg-rose-50/50 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100"
                    >
                      Reject Vendor
                    </button>
                  </div>
                ) : null}

                {vendor.rejectionReason ? (
                  <div className="mb-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                    <p className="font-semibold">Latest rejection reason</p>
                    <p className="mt-1">{vendor.rejectionReason}</p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setConfirmAction("deleted")}
                  className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 mb-2"
                >
                  Soft Delete Vendor
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6 lg:col-span-2">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bed className="h-5 w-5 text-indigo-500" />
                  Properties
                </CardTitle>
                <div className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {properties.length} Active
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {properties.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No properties listed yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-600">Property</TableHead>
                      <TableHead className="font-semibold text-slate-600">Type</TableHead>
                      <TableHead className="font-semibold text-slate-600">City</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property) => (
                      <TableRow key={property.id} className="cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => navigate(`/properties/${property.slug}`)}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-slate-900">{property.name}</p>
                            <p className="truncate max-w-[200px] text-xs text-slate-500">
                              {property.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 capitalize">
                            {property.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 font-medium">{property.city}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={propertyStatusLabels[property.status]}
                            variant={propertyStatusVariants[property.status]}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <button className="flex items-center justify-end w-full text-slate-400 hover:text-indigo-600 transition-colors">
                            <Eye className="h-5 w-5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-violet-500" />
                  Recent Bookings
                </CardTitle>
                <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  {bookings.length} Displayed
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No recent bookings.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-600">ID & Date</TableHead>
                      <TableHead className="font-semibold text-slate-600">Guest</TableHead>
                      <TableHead className="font-semibold text-slate-600">Property</TableHead>
                      <TableHead className="font-semibold text-slate-600">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id} className="cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => navigate(`/bookings/${booking.id}`)}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                              #{booking.bookingNumber || booking.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">
                              {booking.user?.name || "Guest"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 max-w-[150px] truncate">
                              {booking.property?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-bold text-slate-900">
                            ₹{booking.totalAmount.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 items-start">
                            <StatusBadge
                              label={bookingStatusLabels[booking.status]}
                              variant={bookingStatusVariants[booking.status]}
                            />
                            <StatusBadge
                              label={booking.paymentStatus}
                              variant={paymentVariants[booking.paymentStatus]}
                              className="capitalize text-[10px] px-1.5 py-0 shadow-none border"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mt-6">
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-amber-500" />
                Recent Payouts
              </CardTitle>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                {vendor.payouts?.length || 0} Displays
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!vendor.payouts || vendor.payouts.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No recent payouts.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="font-semibold text-slate-600">ID & Date</TableHead>
                    <TableHead className="font-semibold text-slate-600">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendor.payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">
                            #{payout.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-slate-900">
                          ₹{Number(payout.amount).toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={payout.status.toLowerCase()}
                          variant={payout.status === 'PAID' ? 'success' : payout.status === 'PROCESSING' || payout.status === 'APPROVED' ? 'warning' : payout.status === 'FAILED' || payout.status === 'REJECTED' ? 'danger' : 'neutral'}
                          className="capitalize"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <EditVendorModal
        vendor={vendor}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updatedVendor) => {
          setVendor(updatedVendor);
          setIsEditModalOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
            setRejectReason("")
          }
        }}
        title={confirmAction === "suspended" ? "Suspend Vendor" : confirmAction === "deleted" ? "Delete Vendor" : confirmAction === "rejected" ? "Reject Vendor" : "Approve/Reactivate Vendor"}
        description={
          confirmAction === "suspended"
            ? "Are you sure you want to suspend this vendor? They will not be able to log in or manage properties."
            : confirmAction === "deleted"
              ? "Are you sure you want to soft delete this vendor? This will suspend all properties and block logins."
              : confirmAction === "rejected"
                ? "Are you sure you want to reject this vendor? A rejection reason will be saved for follow-up."
              : "Are you sure you want to approve and reactivate this vendor? They will gain access to their account."
        }
        confirmText={confirmAction === "suspended" ? "Suspend" : confirmAction === "deleted" ? "Delete" : confirmAction === "rejected" ? "Reject" : "Approve"}
        onConfirm={confirmStatusChange}
        variant={confirmAction === "suspended" || confirmAction === "deleted" || confirmAction === "rejected" ? "danger" : "default"}
      >
        {confirmAction === "rejected" ? (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Explain why this vendor is being rejected..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>
        ) : null}
      </ConfirmDialog>
    </motion.div>
  );
}
