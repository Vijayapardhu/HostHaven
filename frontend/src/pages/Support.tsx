import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LifeBuoy, PlusCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

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
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await api.support.getMy();
        const list = (Array.isArray(response?.data) ? response.data : []) as SupportTicket[];
        setTickets(list);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      void loadTickets();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Please log in</h1>
            <p className="text-muted-foreground mb-6">Log in to raise and track support tickets.</p>
            <Link to="/login" state={{ from: "/profile/support" }}>
              <Button variant="gold">Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Support Center</h1>
              <p className="text-muted-foreground">Track your tickets or raise a new issue.</p>
            </div>
            <Button variant="gold" onClick={() => navigate("/profile/support/raise") }>
              <PlusCircle className="w-4 h-4 mr-2" />
              Raise Ticket
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">My Tickets</h2>
                <span className="text-sm text-muted-foreground">{tickets.length} total</span>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading tickets...</p>
                ) : tickets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <LifeBuoy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground">No tickets yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first support request.</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/profile/support/${ticket.id}`}
                      className="block rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{ticket.ticketNumber}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ticket.category}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${statusClasses[ticket.status]}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-3 line-clamp-2">{ticket.message}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          View details
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Raise a Ticket</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Need help with bookings, payments, check-in, refunds, or another issue? Create a support ticket and our team will review it.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground mb-6">
                <p>- Booking and check-in issues</p>
                <p>- Payment and refund support</p>
                <p>- Service and property complaints</p>
                <p>- Account related assistance</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/profile/support/raise") }>
                Go to Raise Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
