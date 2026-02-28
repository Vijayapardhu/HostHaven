import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { vendorsService, type Vendor } from "../../lib/vendors";
import { ImageUpload, type UploadedImage } from "../ui/ImageUpload";

interface EditVendorModalProps {
    vendor: Vendor;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedVendor: Vendor) => void;
}

export function EditVendorModal({ vendor, isOpen, onClose, onSuccess }: EditVendorModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: vendor.user?.name || "",
        email: vendor.user?.email || "",
        phone: vendor.phone || "",
        businessName: vendor.businessName || "",
        businessAddress: vendor.businessAddress || "",
        gstNumber: vendor.gstNumber || "",
        panNumber: vendor.panNumber || "",
        aadhaarNumber: vendor.aadhaarNumber || "",
    });

    const [passportPhoto, setPassportPhoto] = useState<UploadedImage[]>(
        vendor.passportPhoto ? [{ url: vendor.passportPhoto, alt: "Passport Photo", isPrimary: true }] : []
    );

    const [companyLogo, setCompanyLogo] = useState<UploadedImage[]>(
        vendor.companyLogo ? [{ url: vendor.companyLogo, alt: "Company Logo", isPrimary: true }] : []
    );

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                businessName: formData.businessName,
                businessAddress: formData.businessAddress,
                gstNumber: formData.gstNumber,
                panNumber: formData.panNumber,
                aadhaarNumber: formData.aadhaarNumber,
            };

            if (passportPhoto.length > 0 && passportPhoto[0].url) {
                payload.passportPhoto = passportPhoto[0].url;
            }
            if (companyLogo.length > 0 && companyLogo[0].url) {
                payload.companyLogo = companyLogo[0].url;
            }

            await vendorsService.updateVendor(vendor.id, payload);
            toast.success("Vendor details updated successfully");

            // Assume success triggers a refresh on parent
            onSuccess({
                ...vendor,
                ...payload,
                user: { ...vendor.user, name: payload.name, email: payload.email },
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update vendor details");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Edit Vendor Details</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Vendor Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Phone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Business Name</label>
                            <input
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Business Address</label>
                            <input
                                name="businessAddress"
                                value={formData.businessAddress}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">GST Number</label>
                            <input
                                name="gstNumber"
                                value={formData.gstNumber}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">PAN Number</label>
                            <input
                                name="panNumber"
                                value={formData.panNumber}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Aadhaar Number</label>
                            <input
                                name="aadhaarNumber"
                                value={formData.aadhaarNumber}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Passport Photo</label>
                            <ImageUpload
                                images={passportPhoto}
                                onChange={setPassportPhoto}
                                maxImages={1}
                                folder="hosthaven/vendors/passport"
                                label="Passport Photo"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Company Logo</label>
                            <ImageUpload
                                images={companyLogo}
                                onChange={setCompanyLogo}
                                maxImages={1}
                                folder="hosthaven/vendors/logo"
                                label="Company Logo"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
