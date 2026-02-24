import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

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
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({
    category: "",
    bookingReference: "",
    message: "",
    attachmentUrl: "",
  });

  const loadTickets = async () => {
    try {
      const response = await api.support.getMy();
      const list = (Array.isArray(response) ? response : (response as any)?.tickets || []) as SupportTicket[];
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.category.trim() || !form.message.trim()) {
      alert("Please fill category and message.");
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

      alert("Support ticket submitted.");
      setForm({ category: "", bookingReference: "", message: "", attachmentUrl: "" });
      await loadTickets();
    } catch (error: any) {
      alert(error?.message || "Failed to submit ticket.");
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
                  <label className="text-sm font-medium text-foreground">Image Attachment URL (optional)</label>
                  <input
                    type="url"
                    value={form.attachmentUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, attachmentUrl: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
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
