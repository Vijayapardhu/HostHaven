import { ProgressBar } from "@/components/ui/progress-bar";
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
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  BarChart3,
  PieChart,
  Grid3X3,
  List,
  Printer,
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
import { bookingsService } from "@/lib/bookings";
import { inventoryService } from "@/lib/inventory";
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
  pricing: { baseAmount: number; taxAmount: number; discountAmount: number; totalAmount: number; taxPercent?: number };
  payment: { status: string; method: string; amount: number };
  vendor: { name: string; email: string; phone: string };
}

const VendorPOS = () => {
  const [inventory, setInventory] = useState<PropertyInventory[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "visual">("visual");
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
    paymentMethod: "CASH" as "CASH" | "CARD" | "UPI" | "RAZORPAY",
    isOnline: false,
  });

  useEffect(() => {
    fetchInventory();
  }, [currentDate]);

  const fetchInventory = async () => {
    try {
      const data = await inventoryService.getRoomInventory(currentDate);
      setInventory(data || []);
      if (data && data.length > 0) {
        setProperties(data.map((p: PropertyInventory) => ({ id: p.propertyId, name: p.propertyName })));
        setSelectedProperty(data[0].propertyId);
        setRooms(data[0].rooms);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
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
      const result = await bookingsService.quickBooking({
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
      await bookingsService.checkIn(bookingId);
      toast({ title: "Guest checked in successfully" });
      fetchInventory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const invoice = await bookingsService.getInvoice(bookingId);
      setInvoiceData(invoice);
      await bookingsService.checkOut(bookingId);
      toast({ title: "Guest checked out successfully" });
      setIsInvoiceOpen(true);
      fetchInventory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleViewInvoice = async (bookingId: string) => {
    try {
      const invoice = await bookingsService.getInvoice(bookingId);
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
      paymentMethod: "CASH" as "CASH" | "CARD" | "UPI" | "RAZORPAY",
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
  const occupancyRate = totalRoomsCount > 0 ? Math.round((totalFilled / totalRoomsCount) * 100) : 0;

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "from-red-500 to-orange-500";
    if (rate >= 50) return "from-green-500 to-yellow-500";
    return "from-blue-500 to-cyan-500";
  };

  const renderVisualRoomGrid = () => {
    return (
      <div className="space-y-6">
        {rooms.map((room) => {
          const roomBlocks = [];
          for (let i = 0; i < room.totalRooms; i++) {
            const isFilled = i < room.filledRooms;
            const booking = room.bookings[i];
            roomBlocks.push(
              <motion.div
                key={`${room.roomId}-${i}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`
                  relative h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer
                  transition-all duration-200 hover:scale-105 hover:shadow-lg
                  ${isFilled 
                    ? "bg-gradient-to-br from-red-400 to-red-600 text-white" 
                    : "bg-gradient-to-br from-green-400 to-green-600 text-white"
                  }
                `}
                onClick={() => booking && handleViewInvoice(booking.bookingId)}
              >
                <span className="text-xs font-bold">{i + 1}</span>
                {booking && (
                  <span className="text-[10px] truncate max-w-full px-1">{booking.guestName.split(" ")[0]}</span>
                )}
                {isFilled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-2 h-2 text-white" />
                  </div>
                )}
              </motion.div>
            );
          }

          return (
            <Card key={room.roomId} className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <BedDouble className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{room.roomName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{room.roomType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center px-3">
                      <p className="text-xl font-bold text-green-600">{room.availableRooms}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xl font-bold text-red-600">{room.filledRooms}</p>
                      <p className="text-xs text-muted-foreground">Filled</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xl font-bold">{room.totalRooms}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={room.filledRooms}
                    max={room.totalRooms}
                    className="h-2"
                    barClassName={`bg-gradient-to-r ${getOccupancyColor((room.filledRooms / room.totalRooms) * 100)}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {roomBlocks}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderOccupancyChart = () => {
    const filledPercent = occupancyRate;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Occupancy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-green-100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradientFilled)"
                  strokeWidth="12"
                  strokeDasharray={`${filledPercent * 2.51} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradientFilled" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className="text-green-500" stopColor="#22c55e" />
                    <stop offset="100%" className="text-red-500" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{occupancyRate}%</span>
                <span className="text-sm text-muted-foreground">Occupied</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Filled Rooms</span>
                </div>
                <span className="font-semibold">{totalFilled}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Available Rooms</span>
                </div>
                <span className="font-semibold">{totalAvailable}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <span className="text-sm">Total Rooms</span>
                </div>
                <span className="font-semibold">{totalRoomsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Room Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rooms.map((room) => {
              const rate = room.totalRooms > 0 ? Math.round((room.filledRooms / room.totalRooms) * 100) : 0;
              return (
                <div key={room.roomId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{room.roomName}</span>
                    <span className="text-sm text-muted-foreground">{rate}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${
                        rate >= 80 ? "from-red-500 to-red-600" :
                        rate >= 50 ? "from-yellow-500 to-green-500" :
                        "from-blue-500 to-cyan-500"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {room.filledRooms} / {room.totalRooms} rooms
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTimeline = () => {
    const allBookings = rooms.flatMap(room => 
      room.bookings.map(booking => ({
        ...booking,
        roomName: room.roomName,
        roomType: room.roomType,
      }))
    ).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Booking Timeline - {currentDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allBookings.length > 0 ? (
            <div className="space-y-3">
              {allBookings.map((booking, index) => (
                <motion.div
                  key={booking.bookingId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${booking.status === "CHECKED_IN" ? "bg-blue-100" : "bg-green-100"}
                  `}>
                    {booking.status === "CHECKED_IN" ? (
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{booking.guestName}</p>
                      <Badge variant="outline" className="text-xs">{booking.roomName}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking.status)}
                    {booking.status === "CONFIRMED" && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckIn(booking.bookingId)}>
                        Check In
                      </Button>
                    )}
                    {booking.status === "CHECKED_IN" && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.bookingId)}>
                        Check Out
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleViewInvoice(booking.bookingId)}>
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No bookings for this date</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
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
                <div className="space-y-2"><Label>Guest Name *</Label><Input value={bookingForm.guestName} onChange={(e) => setBookingForm((p) => ({ ...p, guestName: e.target.value }))} required maxLength={100} /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={bookingForm.guestPhone} onChange={(e) => setBookingForm((p) => ({ ...p, guestPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} required inputMode="numeric" maxLength={10} placeholder="10-digit phone" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Check-in *</Label><Input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm((p) => ({ ...p, checkInDate: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Check-out *</Label><Input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm((p) => ({ ...p, checkOutDate: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Adults *</Label><Input type="number" min="1" value={bookingForm.adults} onChange={(e) => setBookingForm((p) => ({ ...p, adults: parseInt(e.target.value) }))} required /></div>
                <div className="space-y-2"><Label>Children</Label><Input type="number" min="0" value={bookingForm.children} onChange={(e) => setBookingForm((p) => ({ ...p, children: parseInt(e.target.value) }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Total Amount (₹) *</Label>
                <Input type="number" value={bookingForm.totalAmount} onChange={(e) => setBookingForm((p) => ({ ...p, totalAmount: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={bookingForm.paymentMethod} onValueChange={(v: "CASH" | "CARD" | "UPI" | "RAZORPAY") => setBookingForm((p) => ({ ...p, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="RAZORPAY">Online Payment</SelectItem>
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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => handleDateChange("prev")}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDateChange("next")}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProperty} onValueChange={handlePropertyChange}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select property" /></SelectTrigger>
            <SelectContent>
              {properties.map((property) => (<SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "visual" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("visual")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Occupied</p>
                <p className="text-3xl font-bold text-red-700">{totalFilled}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-200 flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <TrendingUp className="w-3 h-3" />
              <span>{occupancyRate}% of capacity</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Available</p>
                <p className="text-3xl font-bold text-green-700">{totalAvailable}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-200 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingDown className="w-3 h-3" />
              <span>{100 - occupancyRate}% free</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Rooms</p>
                <p className="text-3xl font-bold text-blue-700">{totalRoomsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-200 flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <Users className="w-3 h-3" />
              <span>{rooms.length} room types</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold text-purple-700">₹{totalFilled * 2500}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
              <TrendingUp className="w-3 h-3" />
              <span>Estimated</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "visual" && renderVisualRoomGrid()}
      {viewMode === "grid" && renderOccupancyChart()}
      {viewMode === "list" && (
        <div className="space-y-4">
          {renderTimeline()}
        </div>
      )}

      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Invoice</DialogTitle>
          </DialogHeader>
          {invoiceData && (
            <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden" id="invoice-print">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                    <p className="text-white/80 text-sm mt-1">{invoiceData.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{invoiceData.vendor.name}</p>
                    <p className="text-white/80 text-sm">{invoiceData.vendor.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Property</p>
                    <p className="font-semibold">{invoiceData.property.name}</p>
                    <p className="text-sm text-muted-foreground">{invoiceData.property.address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Booking Details</p>
                    <p className="font-semibold">#{invoiceData.bookingDetails.bookingNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoiceData.bookingDetails.checkIn).toLocaleDateString()} - {new Date(invoiceData.bookingDetails.checkOut).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-primary">{invoiceData.bookingDetails.nights} Night(s)</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Guest Information</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">{invoiceData.guest.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{invoiceData.guest.name}</p>
                      <p className="text-sm text-muted-foreground">{invoiceData.guest.phone} • {invoiceData.guest.email}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Room Charges ({invoiceData.bookingDetails.nights} nights × ₹{invoiceData.pricing.baseAmount && invoiceData.bookingDetails.nights ? Math.round(invoiceData.pricing.baseAmount / invoiceData.bookingDetails.nights) : 0})</span>
                      <span>₹{invoiceData.pricing.baseAmount?.toLocaleString() || 0}</span>
                    </div>
                    {invoiceData.pricing.taxPercent ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CGST ({invoiceData.pricing.taxPercent / 2}%)</span>
                          <span>₹{((invoiceData.pricing.taxAmount || 0) / 2).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">SGST ({invoiceData.pricing.taxPercent / 2}%)</span>
                          <span>₹{((invoiceData.pricing.taxAmount || 0) / 2).toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>₹{invoiceData.pricing.taxAmount?.toLocaleString() || 0}</span>
                      </div>
                    )}
                    {invoiceData.pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₹{invoiceData.pricing.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-3 border-t">
                      <span>Total Amount</span>
                      <span className="text-primary">₹{invoiceData.pricing.totalAmount?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Payment {invoiceData.payment.status}</span>
                  </div>
                  <span className="text-sm text-green-600">{invoiceData.payment.method}</span>
                </div>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                  <p>Thank you for choosing {invoiceData.vendor.name}</p>
                  <p className="mt-1">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" />Print
            </Button>
            <Button onClick={() => setIsInvoiceOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorPOS;
