import { useEffect, useState } from "react";
import { Headphones, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportService } from "@/lib/support";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";
import EmptyState from "@/components/states/EmptyState";

interface TicketRecord {
  id: string;
  ticketNumber?: string;
  subject?: string;
  category: string;
  status: string;
  priority?: string;
  message: string;
  createdAt: string;
}

const VendorSupportIndex = () => {
  const { toast } = useToast();

  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newTicket, setNewTicket] = useState({
    category: "",
    message: "",
    bookingReference: "",
  });

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await supportService.getMyTickets(params);
      const ticketList = Array.isArray(response) ? response : response?.data || [];
      setTickets(ticketList);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to load tickets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [statusFilter]);

  const handleCreateTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await supportService.createTicket({
        category: newTicket.category,
        message: newTicket.message,
        bookingReference: newTicket.bookingReference || undefined,
      });

      toast({ title: "Ticket created" });
      setIsCreateOpen(false);
      setNewTicket({ category: "", message: "", bookingReference: "" });
      await loadTickets();
    } catch (error: any) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      ticket.subject?.toLowerCase().includes(query) ||
      ticket.ticketNumber?.toLowerCase().includes(query) ||
      ticket.message?.toLowerCase().includes(query);
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      OPEN: { label: "Open", className: "bg-green-100 text-green-700" },
      IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
      RESOLVED: { label: "Resolved", className: "bg-gray-100 text-gray-700" },
      CLOSED: { label: "Closed", className: "" },
    };

    const config = statusMap[status] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Support</h1>
          <p className="text-muted-foreground mt-1">Manage your support tickets</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOOKING">Booking Issue</SelectItem>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="PROPERTY">Property</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                    <SelectItem value="ACCOUNT">Account</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Booking Reference (Optional)</label>
                <Input
                  value={newTicket.bookingReference}
                  onChange={(e) => setNewTicket({ ...newTicket, bookingReference: e.target.value })}
                  placeholder="Enter booking ID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Describe your issue..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Ticket</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState className="p-8" message="Loading support tickets..." />
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<Headphones className="w-12 h-12 text-muted" />}
              title="No support tickets found"
              description="Create a ticket to contact support."
            />
          ) : (
            <div className="divide-y">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-muted-foreground">{ticket.ticketNumber || ticket.id.slice(0, 8)}</p>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <h3 className="font-semibold mt-1">{ticket.subject || ticket.category}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">Created {new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSupportIndex;
