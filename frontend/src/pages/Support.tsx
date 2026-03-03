import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  bookingReference?: string;
  message: string;
  attachmentUrl?: string;
  status: TicketStatus;
  createdAt: string;
}

const statusClasses: Record<TicketStatus, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
};

const Support = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({
    category: "",
    bookingReference: "",
    message: "",
    attachmentUrl: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTickets = async () => {
    try {
      const response = await api.support.getMy();
      const list = (Array.isArray(response?.data) ? response.data : []) as SupportTicket[];
      setTickets(list);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadTickets();
    }
  }, [isAuthenticated]);

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Please log in</h1>
            <p className="text-muted-foreground mb-6">Log in to raise and track support tickets.</p>
            <Link to="/login">
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
    } catch (error) {
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

    if (!form.category.trim() || !form.message.trim()) {
      toast({ title: "Please fill category and message", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      await api.support.create({
        category: form.category,
        bookingReference: form.bookingReference || undefined,
        message: form.message,
        attachmentUrl: form.attachmentUrl || undefined,
      });

      toast({ title: "Support ticket submitted successfully" });
      setForm({ category: "", bookingReference: "", message: "", attachmentUrl: "" });
      setPreviewUrl(null);
      await loadTickets();
    } catch (error: any) {
      toast({ title: error?.message || "Failed to submit ticket", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Support</h1>
          <p className="text-muted-foreground mb-8">Create a ticket from your profile and track status updates.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4">Raise a Ticket</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-foreground">Issue Category</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Payment, booking, check-in, etc."
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Booking Reference (optional)</label>
                  <input
                    type="text"
                    value={form.bookingReference}
                    onChange={(e) => setForm((prev) => ({ ...prev, bookingReference: e.target.value }))}
                    placeholder="Booking number"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
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
                  />
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={loading || isUploading}>
                  {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-semibold mb-4">My Tickets</h2>
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets yet.</p>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{ticket.ticketNumber}</p>
                          <p className="text-xs text-muted-foreground">{ticket.category}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[ticket.status]}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      {ticket.attachmentUrl && (
                        <img
                          src={ticket.attachmentUrl}
                          alt="Attachment"
                          className="mt-2 w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      {ticket.bookingReference && (
                        <p className="text-xs text-muted-foreground mt-2">Ref: {ticket.bookingReference}</p>
                      )}
                      <p className="text-sm text-foreground mt-2">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
