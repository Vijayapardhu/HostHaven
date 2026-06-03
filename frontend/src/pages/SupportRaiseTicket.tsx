import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Upload, X } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getFieldHint, validateField } from "@/lib/formValidation";
import { useToast } from "@/hooks/use-toast";

const SupportRaiseTicket = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ category?: string; message?: string; bookingReference?: string }>({});
  const [form, setForm] = useState({
    category: "",
    bookingReference: "",
    message: "",
    attachmentUrl: "",
  });

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Please log in</h1>
            <p className="text-muted-foreground mb-6">Log in to create a support ticket.</p>
            <Link to="/login" state={{ from: "/profile/support/raise" }}>
              <Button variant="gold">Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);

    try {
      const uploadedUrl = await api.auth.uploadAvatar(file);
      setForm((prev) => ({ ...prev, attachmentUrl: uploadedUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch {
      toast({ title: "Failed to upload image", variant: "destructive" });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setForm((prev) => ({ ...prev, attachmentUrl: "" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const categoryValidation = validateField("supportCategory", form.category);
    const messageValidation = validateField("supportMessage", form.message);
    const bookingValidation = validateField("bookingReference", form.bookingReference);

    const nextErrors: { category?: string; message?: string; bookingReference?: string } = {};
    if (!categoryValidation.valid) nextErrors.category = categoryValidation.errors[0];
    if (!messageValidation.valid) nextErrors.message = messageValidation.errors[0];
    if (!bookingValidation.valid) nextErrors.bookingReference = bookingValidation.errors[0];
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast({ title: "Please correct highlighted fields", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const ticket = await api.support.create({
        category: form.category,
        bookingReference: form.bookingReference || undefined,
        message: form.message,
        attachmentUrl: form.attachmentUrl || undefined,
      });

      toast({ title: "Support ticket submitted successfully" });
      navigate(`/profile/support/${ticket.id}`);
    } catch (error: any) {
      toast({ title: error?.message || "Failed to submit ticket", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8">
            <Link to="/profile/support" className="text-sm text-primary hover:underline">Back to Support</Link>
            <h1 className="text-3xl font-serif font-bold text-foreground mt-2 mb-2">Raise a Ticket</h1>
            <p className="text-muted-foreground">Share your issue clearly so the support team can help faster.</p>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-foreground">Issue Category</label>
                <input
                  type="text"
                  required
                  value={form.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, category: value }));
                    if (fieldErrors.category) {
                      const result = validateField("supportCategory", value);
                      setFieldErrors((prev) => ({ ...prev, category: result.valid ? undefined : result.errors[0] }));
                    }
                  }}
                  placeholder="Payment, booking, check-in, etc."
                  minLength={2}
                  maxLength={80}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                {fieldErrors.category ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.category}</p> : <p className="mt-1 text-xs text-muted-foreground">{getFieldHint("supportCategory")}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Booking Reference (optional)</label>
                <input
                  type="text"
                  value={form.bookingReference}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, bookingReference: value }));
                    if (fieldErrors.bookingReference) {
                      const result = validateField("bookingReference", value);
                      setFieldErrors((prev) => ({ ...prev, bookingReference: result.valid ? undefined : result.errors[0] }));
                    }
                  }}
                  placeholder="Booking number"
                  maxLength={80}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                {fieldErrors.bookingReference ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.bookingReference}</p> : <p className="mt-1 text-xs text-muted-foreground">{getFieldHint("bookingReference")}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea
                  rows={6}
                  required
                  value={form.message}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, message: value }));
                    if (fieldErrors.message) {
                      const result = validateField("supportMessage", value);
                      setFieldErrors((prev) => ({ ...prev, message: result.valid ? undefined : result.errors[0] }));
                    }
                  }}
                  placeholder="Describe your issue"
                  minLength={5}
                  maxLength={3000}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                {fieldErrors.message ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.message}</p> : <p className="mt-1 text-xs text-muted-foreground">{getFieldHint("supportMessage")}</p>}
                <p className="mt-1 text-xs text-muted-foreground text-right">{form.message.length}/3000</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Image Attachment (optional)</label>

                {previewUrl || form.attachmentUrl ? (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={previewUrl || form.attachmentUrl}
                      alt="Attachment preview"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80"
                      title="Remove attachment"
                      aria-label="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">Click to upload image</span>
                        <span className="text-xs">Max 5MB (PNG, JPG, JPEG)</span>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                  title="Upload support attachment"
                  aria-label="Upload support attachment"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/profile/support") }>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" className="w-full" disabled={loading || isUploading}>
                  {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupportRaiseTicket;
