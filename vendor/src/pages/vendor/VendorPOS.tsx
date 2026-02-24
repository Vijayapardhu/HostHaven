import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  BedDouble,
  UserCheck,
  UserX,
  Plus,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  FileText,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RoomBooking {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

interface RoomInventory {
  roomId: string;
  roomName: string;
  roomType: string;
  totalRooms: number;
  filledRooms: number;
  availableRooms: number;
  bookings: RoomBooking[];
}

interface PropertyInventory {
  propertyId: string;
  propertyName: string;
  rooms: RoomInventory[];
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  bookingDetails: {
    bookingNumber: string;
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  property: { name: string; address: string };
  room: { name: string; type: string };
  guest: { name: string; email: string; phone: string };
  pricing: { baseAmount: number; taxAmount: number; discountAmount: number; totalAmount: number };
  payment: { status: string; method: string; amount: number };
  vendor: { name: string; email: string; phone: string };
}

const VendorPOS = () => {
  const [inventory, setInventory] = useState<PropertyInventory[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [bookingForm, setBookingForm] = useState({
    roomId: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    adults: 1,
    children: 0,
    totalAmount: "",
    paymentMethod: "CASH" as "CASH" | "CARD" | "UPI" | "ONLINE",
    isOnline: false,
  });

  useEffect(() => {
    fetchInventory();
  }, [currentDate]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await api.vendor.getRoomInventory(currentDate);
      setInventory(data || []);
      if (data && data.length > 0) {
        setProperties(data.map((p: PropertyInventory) => ({ id: p.propertyId, name: p.propertyName })));
        setSelectedProperty(data[0].propertyId);
        setRooms(data[0].rooms);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId);
    const property = inventory.find((p) => p.propertyId === propertyId);
    setRooms(property?.rooms || []);
  };

  const handleDateChange = (direction: "prev" | "next") => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const handleQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.roomId || !bookingForm.guestName || !bookingForm.guestPhone || !bookingForm.totalAmount) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.vendor.quickBooking({
        propertyId: selectedProperty,
        roomId: bookingForm.roomId,
        guestName: bookingForm.guestName,
        guestPhone: bookingForm.guestPhone,
        guestEmail: bookingForm.guestEmail,
        checkInDate: bookingForm.checkInDate,
        checkOutDate: bookingForm.checkOutDate,
        adults: bookingForm.adults,
        children: bookingForm.children,
        totalAmount: parseFloat(bookingForm.totalAmount),
        paymentMethod: bookingForm.paymentMethod,
        isOnline: bookingForm.isOnline,
      });

      toast({ title: "Booking created successfully" });
      setIsQuickBookingOpen(false);
      setInvoiceData(result.invoice);
      setIsInvoiceOpen(true);
      fetchInventory();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create booking", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      await api.vendor.checkIn(bookingId);
      toast({ title: "Guest checked in successfully" });
      fetchInventory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const invoice = await api.vendor.getInvoice(bookingId);
      setInvoiceData(invoice);
      await api.vendor.checkOut(bookingId);
      toast({ title: "Guest checked out successfully" });
      setIsInvoiceOpen(true);
      fetchInventory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleViewInvoice = async (bookingId: string) => {
    try {
      const invoice = await api.vendor.getInvoice(bookingId);
      setInvoiceData(invoice);
      setIsInvoiceOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setBookingForm({
      roomId: "",
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      checkInDate: new Date().toISOString().split("T")[0],
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      adults: 1,
      children: 0,
      totalAmount: "",
      paymentMethod: "CASH",
      isOnline: false,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-700"><Clock className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-700"><UserCheck className="w-3 h-3 mr-1" />Checked In</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalFilled = rooms.reduce((sum, r) => sum + r.filledRooms, 0);
  const totalAvailable = rooms.reduce((sum, r) => sum + r.availableRooms, 0);
  const totalRoomsCount = rooms.reduce((sum, r) => sum + r.totalRooms, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Room Inventory (POS)</h1>
          <p className="text-muted-foreground mt-1">Track room availability and manage bookings</p>
        </div>
        <Dialog open={isQuickBookingOpen} onOpenChange={setIsQuickBookingOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Quick Booking</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Booking</DialogTitle></DialogHeader>
            <form onSubmit={handleQuickBooking} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Room *</Label>
                <Select value={bookingForm.roomId} onValueChange={(v) => setBookingForm((p) => ({ ...p, roomId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.roomId} value={room.roomId} disabled={room.availableRooms === 0}>
                        {room.roomName} ({room.availableRooms} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Guest Name *</Label><Input value={bookingForm.guestName} onChange={(e) => setBookingForm((p) => ({ ...p, guestName: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={bookingForm.guestPhone} onChange={(e) => setBookingForm((p) => ({ ...p, guestPhone: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Check-in *</Label><Input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm((p) => ({ ...p, checkInDate: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Check-out *</Label><Input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm((p) => ({ ...p, checkOutDate: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Adults *</Label><Input type="number" min="1" value={bookingForm.adults} onChange={(e) => setBookingForm((p) => ({ ...p, adults: parseInt(e.target.value) }))} required /></div>
                <div className="space-y-2"><Label>Total Amount (₹) *</Label><Input type="number" value={bookingForm.totalAmount} onChange={(e) => setBookingForm((p) => ({ ...p, totalAmount: e.target.value }))} required /></div>
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={bookingForm.paymentMethod} onValueChange={(v: "CASH" | "CARD" | "UPI" | "ONLINE") => setBookingForm((p) => ({ ...p, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="ONLINE">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsQuickBookingOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isProcessing}>{isProcessing ? "Processing..." : "Create Booking"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Navigation */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => handleDateChange("prev")}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDateChange("next")}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <Select value={selectedProperty} onValueChange={handlePropertyChange}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select property" /></SelectTrigger>
          <SelectContent>
            {properties.map((property) => (<SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><UserX className="w-5 h-5 text-red-600" /></div>
              <div><p className="text-2xl font-bold">{totalFilled}</p><p className="text-sm text-muted-foreground">Rooms Filled</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><UserCheck className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{totalAvailable}</p><p className="text-sm text-muted-foreground">Rooms Available</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><LayoutGrid className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{totalRoomsCount}</p><p className="text-sm text-muted-foreground">Total Rooms</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4].map((i) => (<div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"></div>))}</div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <motion.div key={room.roomId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`border-0 shadow-lg ${room.availableRooms === 0 ? 'ring-2 ring-red-200' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><BedDouble className="w-5 h-5 text-primary" />{room.roomName}</CardTitle>
                    <Badge variant="outline">{room.roomType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center"><p className="text-2xl font-bold text-red-600">{room.filledRooms}</p><p className="text-xs text-muted-foreground">Filled</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-green-600">{room.availableRooms}</p><p className="text-xs text-muted-foreground">Available</p></div>
                    <div className="text-center"><p className="text-2xl font-bold">{room.totalRooms}</p><p className="text-xs text-muted-foreground">Total</p></div>
                  </div>
                  <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-red-500" style={{ width: `${(room.filledRooms / room.totalRooms) * 100}%` }} />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {room.bookings.length > 0 ? room.bookings.map((booking) => (
                      <div key={booking.bookingId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                        <div><p className="font-medium">{booking.guestName}</p><p className="text-xs text-muted-foreground">{booking.phone}</p></div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(booking.status)}
                          {booking.status === "CONFIRMED" && <Button size="sm" variant="outline" onClick={() => handleCheckIn(booking.bookingId)}>Check In</Button>}
                          {booking.status === "CHECKED_IN" && <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.bookingId)}>Check Out</Button>}
                          <Button size="sm" variant="ghost" onClick={() => handleViewInvoice(booking.bookingId)}><FileText className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-2">No bookings</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Rooms Found</h3>
            <p className="text-muted-foreground">Add rooms to your hotel to manage inventory</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Invoice</DialogTitle></DialogHeader>
          {invoiceData && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div><h3 className="text-xl font-bold">{invoiceData.vendor.name}</h3><p className="text-sm text-muted-foreground">{invoiceData.vendor.email}</p></div>
                <div className="text-right"><p className="text-lg font-bold">INVOICE</p><p className="text-sm text-muted-foreground">{invoiceData.invoiceNumber}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><h4 className="font-semibold mb-2">Property</h4><p className="text-sm">{invoiceData.property.name}</p><p className="text-sm text-muted-foreground">{invoiceData.property.address}</p></div>
                <div><h4 className="font-semibold mb-2">Booking</h4><p className="text-sm">#{invoiceData.bookingDetails.bookingNumber}</p><p className="text-sm">Check-in: {new Date(invoiceData.bookingDetails.checkIn).toLocaleDateString()}</p><p className="text-sm">Nights: {invoiceData.bookingDetails.nights}</p></div>
              </div>
              <div><h4 className="font-semibold mb-2">Guest</h4><p className="text-sm">{invoiceData.guest.name}</p><p className="text-sm text-muted-foreground">{invoiceData.guest.phone}</p></div>
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Base Amount</span><span>₹{invoiceData.pricing.baseAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Tax (12%)</span><span>₹{invoiceData.pricing.taxAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span>₹{invoiceData.pricing.totalAmount.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => window.print()}>Print</Button>
                <Button onClick={() => setIsInvoiceOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPOS;
