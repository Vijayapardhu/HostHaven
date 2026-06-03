import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Image as ImageIcon, Ticket, UserCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

interface SupportTicketDetailData {
  id: string;
  ticketNumber: string;
  category: string;
  bookingReference?: string;
  message: string;
  attachmentUrl?: string;
  status: TicketStatus;
  createdAt: string;
  adminNotes?: string | null;
}

const statusClasses: Record<TicketStatus, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
};

const SupportTicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return;
      try {
        const data = await api.support.getMyById(id);
        setTicket(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load ticket details.");
      } finally {
        setLoading(false);
      }
    };

    void loadTicket();
  }, [id]);

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Please log in</h1>
            <p className="text-muted-foreground mb-6">Log in to view ticket details.</p>
            <Link to="/login" state={{ from: `/profile/support/${id}` }}>
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Link to="/profile/support" className="text-sm text-primary hover:underline">Back to Support</Link>
            <h1 className="text-3xl font-serif font-bold text-foreground mt-2">Ticket Details</h1>
          </div>

          {loading ? (
            <div className="bg-card rounded-2xl shadow-card p-6 text-sm text-muted-foreground">Loading ticket...</div>
          ) : error || !ticket ? (
            <div className="bg-card rounded-2xl shadow-card p-6">
              <p className="text-destructive">{error || "Ticket not found."}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl shadow-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Ticket className="w-4 h-4" />
                      <span className="text-sm">{ticket.ticketNumber}</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{ticket.category}</h2>
                  </div>
                  <span className={`px-3 py-1.5 text-xs rounded-full w-fit ${statusClasses[ticket.status]}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCircle2 className="w-4 h-4" />
                    <span>{ticket.bookingReference ? `Booking Ref: ${ticket.bookingReference}` : "No booking reference"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Issue Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-6">{ticket.message}</p>

                {ticket.attachmentUrl && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                      <ImageIcon className="w-4 h-4" />
                      Attachment
                    </div>
                    <img
                      src={ticket.attachmentUrl}
                      alt="Ticket attachment"
                      className="w-full max-w-sm rounded-xl border border-border object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Support Updates</h3>
                {ticket.adminNotes ? (
                  <div className="rounded-xl bg-muted p-4 text-sm text-foreground whitespace-pre-wrap leading-6">
                    {ticket.adminNotes}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No support updates yet. Our team will respond here.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupportTicketDetail;
