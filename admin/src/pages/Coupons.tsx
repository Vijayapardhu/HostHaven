import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Ticket,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  couponsService,
  type Coupon,
  type CouponInput,
  type DiscountType,
} from "../lib/coupons";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import * as Dialog from "@radix-ui/react-dialog";

type FormState = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minBookingAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  perUserLimit: string;
  validFrom: string;
  validUntil: string;
  applicableCities: string;
};

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = (): FormState => {
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return {
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minBookingAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    perUserLimit: "1",
    validFrom: toLocalInput(now.toISOString()),
    validUntil: toLocalInput(in30.toISOString()),
    applicableCities: "",
  };
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await couponsService.getCoupons();
      setCoupons(res.data || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minBookingAmount: c.minBookingAmount != null ? String(c.minBookingAmount) : "",
      maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      perUserLimit: String(c.perUserLimit ?? 1),
      validFrom: toLocalInput(c.validFrom),
      validUntil: toLocalInput(c.validUntil),
      applicableCities: (c.applicableCities || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await couponsService.toggleCoupon(c.id, !c.isActive);
      toast.success(`Coupon ${c.isActive ? "deactivated" : "activated"}`);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update coupon");
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!window.confirm(`Deactivate coupon ${c.code}?`)) return;
    try {
      await couponsService.deleteCoupon(c.id);
      toast.success("Coupon deactivated");
      fetchCoupons();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete coupon");
    }
  };

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error("Coupon code is required");
    const discountValue = Number(form.discountValue);
    if (!discountValue || discountValue <= 0) return toast.error("Enter a valid discount value");
    if (form.discountType === "PERCENTAGE" && discountValue > 100) {
      return toast.error("Percentage discount cannot exceed 100%");
    }
    if (!form.validFrom || !form.validUntil) return toast.error("Set the validity dates");
    if (new Date(form.validUntil) <= new Date(form.validFrom)) {
      return toast.error("Valid-until must be after valid-from");
    }

    const payload: CouponInput = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : undefined,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil).toISOString(),
      applicableCities: form.applicableCities
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await couponsService.updateCoupon(editingId, payload);
        toast.success("Coupon updated");
      } else {
        await couponsService.createCoupon(payload);
        toast.success("Coupon created");
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to save coupon");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(
    () =>
      coupons.filter(
        (c) =>
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [coupons, searchTerm],
  );

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  const discountLabel = (c: Coupon) =>
    c.discountType === "PERCENTAGE"
      ? `${c.discountValue}%${c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ""}`
      : `₹${c.discountValue}`;

  const isExpired = (c: Coupon) => new Date(c.validUntil) < new Date();

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {node}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons & Offers"
        description="Create and manage discount coupons for the user booking flow"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coupon
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{coupons.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalRedemptions}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm ? "No coupons match your search" : "No coupons yet. Create your first one!"}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                      <Ticket className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tracking-wide">{c.code}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {discountLabel(c)}
                        </span>
                        {!c.isActive && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Inactive</span>
                        )}
                        {c.isActive && isExpired(c) && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Expired</span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Used {c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""} ·{" "}
                        Valid till {new Date(c.validUntil).toLocaleDateString()}
                        {c.applicableCities.length > 0 && ` · ${c.applicableCities.join(", ")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end md:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(c)}
                      className={c.isActive ? "text-green-600" : "text-muted-foreground"}
                      title={c.isActive ? "Deactivate" : "Activate"}
                    >
                      {c.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c)}
                      className="text-red-500"
                      title="Deactivate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold">
              {editingId ? "Edit Coupon" : "New Coupon"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mb-4">
              Discounts apply to the pre-tax booking amount at checkout.
            </Dialog.Description>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                {field("Code", (
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME10"
                    disabled={!!editingId}
                    className="uppercase"
                  />
                ))}
                {field("Type", (
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                ))}
              </div>

              {field("Description", (
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="10% off your first booking"
                />
              ))}

              <div className="grid grid-cols-2 gap-4">
                {field(
                  form.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (₹)",
                  <Input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === "PERCENTAGE" ? "10" : "500"}
                  />,
                )}
                {form.discountType === "PERCENTAGE"
                  ? field("Max discount (₹)", (
                      <Input
                        type="number"
                        value={form.maxDiscountAmount}
                        onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                        placeholder="Optional cap"
                      />
                    ))
                  : field("Min booking (₹)", (
                      <Input
                        type="number"
                        value={form.minBookingAmount}
                        onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
                        placeholder="Optional"
                      />
                    ))}
              </div>

              {form.discountType === "PERCENTAGE" &&
                field("Min booking amount (₹)", (
                  <Input
                    type="number"
                    value={form.minBookingAmount}
                    onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
                    placeholder="Optional"
                  />
                ))}

              <div className="grid grid-cols-2 gap-4">
                {field("Total usage limit", (
                  <Input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Unlimited"
                  />
                ), "Blank = unlimited")}
                {field("Per-user limit", (
                  <Input
                    type="number"
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                    placeholder="1"
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {field("Valid from", (
                  <Input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  />
                ))}
                {field("Valid until", (
                  <Input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  />
                ))}
              </div>

              {field("Applicable cities", (
                <Input
                  value={form.applicableCities}
                  onChange={(e) => setForm({ ...form, applicableCities: e.target.value })}
                  placeholder="e.g. VIJAYAWADA, TIRUPATI"
                />
              ), "Comma-separated. Blank = all cities.")}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Save changes" : "Create coupon"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
