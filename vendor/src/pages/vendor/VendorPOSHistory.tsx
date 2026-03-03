import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bookingsService } from "@/lib/bookings";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingNumber: string;
  guestName: string;
  propertyName: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface DailySummary {
  date: string;
  totalBookings: number;
  totalRevenue: number;
  cashPayments: number;
  cardPayments: number;
  upiPayments: number;
  onlinePayments: number;
}

const VendorPOSHistory = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchDailySummary();
  }, [currentPage, paymentFilter, selectedDate]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: "10",
        date: selectedDate,
      };
      if (paymentFilter !== "all") {
        params.paymentMethod = paymentFilter;
      }
      const response = await bookingsService.getBookings(params);
      const bookings = response.data || response || [];
      const invoiceData: Invoice[] = bookings.map((b: any) => ({
        id: b.id,
        invoiceNumber: `INV-${b.bookingNumber}`,
        bookingNumber: b.bookingNumber,
        guestName: b.user?.name || "Guest",
        propertyName: b.property?.name || "",
        roomName: b.room?.name || "Room",
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod || "CASH",
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      }));
      setInvoices(invoiceData);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const response = await bookingsService.getBookings({
        startDate: startDate.toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      });
      
      const summary: Record<string, DailySummary> = {};
      const bookings = response.data || response || [];
      
      bookings.forEach((b: any) => {
        const date = new Date(b.createdAt).toISOString().split("T")[0];
        if (!summary[date]) {
          summary[date] = {
            date,
            totalBookings: 0,
            totalRevenue: 0,
            cashPayments: 0,
            cardPayments: 0,
            upiPayments: 0,
            onlinePayments: 0,
          };
        }
        summary[date].totalBookings++;
        summary[date].totalRevenue += b.totalAmount;
        const method = b.paymentMethod?.toUpperCase() || "CASH";
        if (method === "CASH") summary[date].cashPayments += b.totalAmount;
        else if (method === "CARD") summary[date].cardPayments += b.totalAmount;
        else if (method === "UPI") summary[date].upiPayments += b.totalAmount;
        else summary[date].onlinePayments += b.totalAmount;
      });
      
      setDailySummary(Object.values(summary).sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  const handleExport = () => {
    toast({ title: "Export started", description: "Your export will be ready shortly" });
  };

  const getPaymentIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case "CASH": return <Banknote className="w-4 h-4" />;
      case "CARD": return <CreditCard className="w-4 h-4" />;
      case "UPI": return <Smartphone className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredInvoices = invoices.filter((inv) =>
    inv.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.guestName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todaySummary = dailySummary.find((d) => d.date === selectedDate) || {
    totalBookings: 0,
    totalRevenue: 0,
    cashPayments: 0,
    cardPayments: 0,
    upiPayments: 0,
    onlinePayments: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Sales & Invoices</h1>
          <p className="text-muted-foreground mt-1">View sales history and manage invoices</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Today's Bookings</p>
            <p className="text-2xl font-bold mt-1">{todaySummary.totalBookings}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">₹{todaySummary.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Banknote className="w-4 h-4" />
              Cash
            </div>
            <p className="text-xl font-bold mt-1">₹{todaySummary.cashPayments.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              Card
            </div>
            <p className="text-xl font-bold mt-1">₹{todaySummary.cardPayments.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              UPI/Online
            </div>
            <p className="text-xl font-bold mt-1">₹{(todaySummary.upiPayments + todaySummary.onlinePayments).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by booking ID or guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Invoice #</th>
                    <th className="text-left p-4 font-semibold">Guest</th>
                    <th className="text-left p-4 font-semibold">Room</th>
                    <th className="text-left p-4 font-semibold">Dates</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Payment</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{invoice.bookingNumber}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{invoice.guestName}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{invoice.roomName}</p>
                        <p className="text-xs text-muted-foreground">{invoice.propertyName}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{new Date(invoice.checkInDate).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">to {new Date(invoice.checkOutDate).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold">₹{invoice.totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="gap-1">
                          {getPaymentIcon(invoice.paymentMethod)}
                          {invoice.paymentMethod}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <div>
                  <p className="font-bold text-lg">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.bookingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₹{selectedInvoice.totalAmount.toLocaleString()}</p>
                  <Badge variant="outline">{selectedInvoice.paymentStatus}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Guest</p>
                  <p className="font-medium">{selectedInvoice.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{selectedInvoice.roomName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">{new Date(selectedInvoice.checkInDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">{new Date(selectedInvoice.checkOutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />Print
                </Button>
                <Button className="gap-2">
                  <Download className="w-4 h-4" />Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPOSHistory;
