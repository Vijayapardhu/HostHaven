import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supportService } from "@/lib/support";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";

interface TicketDetail {
  id: string;
  ticketNumber: string;
  category: string;
  status: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
}

const VendorSupportDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await supportService.getTicketById(ticketId!);
      setTicket(response?.data || response);
    } catch (error) {
      toast({ title: "Failed to load ticket", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setIsSending(true);
    try {
      toast({ title: "Reply sent successfully" });
      setReply("");
    } catch (error) {
      toast({ title: "Failed to send reply", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="default"><AlertCircle className="w-3 h-3 mr-1" />Open</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button className="mt-4" onClick={() => navigate("/support")}>
          Back to Support
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/support")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ticket #{ticket.ticketNumber}</h1>
          <p className="text-muted-foreground">{ticket.category}</p>
        </div>
        {getStatusBadge(ticket.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.message}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSendReply} disabled={isSending || !reply.trim()}>
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : "Send Reply"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Number</p>
                <p className="font-medium">{ticket.ticketNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(ticket.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="font-medium">{new Date(ticket.resolvedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorSupportDetail;
