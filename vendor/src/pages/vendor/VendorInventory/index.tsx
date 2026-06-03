import { useEffect, useState } from "react";
import { 
  Building2, 
  BedDouble, 
  Users, 
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inventoryService } from "@/lib/inventory";
import LoadingState from "@/components/states/LoadingState";

interface PropertyInventory {
  propertyId: string;
  propertyName: string;
  propertyImage?: string;
  rooms: RoomInventory[];
}

interface RoomInventory {
  roomId: string;
  roomName: string;
  roomType: string;
  totalRooms: number;
  filledRooms: number;
  availableRooms: number;
  bookings: BookingInfo[];
}

interface BookingInfo {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

const VendorInventory = () => {
  const [properties, setProperties] = useState<PropertyInventory[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyInventory | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<"overview" | "rooms">("overview");
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getRoomInventory(selectedDate);
      const propertiesWithData = Array.isArray(data) ? data : data?.inventory || [];
      setProperties(propertiesWithData);
      
      if (propertiesWithData.length > 0 && !selectedProperty) {
        setSelectedProperty(propertiesWithData[0]);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedDate]);

  const getPropertyStats = (property: PropertyInventory) => {
    const totalRooms = property.rooms.reduce((sum, r) => sum + r.totalRooms, 0);
    const filledRooms = property.rooms.reduce((sum, r) => sum + r.filledRooms, 0);
    const availableRooms = property.rooms.reduce((sum, r) => sum + r.availableRooms, 0);
    return { totalRooms, filledRooms, availableRooms };
  };

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading inventory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Live Booking Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time room availability across all properties
          </p>
        </div>
        
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-muted-foreground">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400"></div>
          <span className="text-sm text-muted-foreground">Unavailable</span>
        </div>
      </div>

      {/* Properties Overview */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => {
            const stats = getPropertyStats(property);
            return (
              <Card 
                key={property.propertyId} 
                className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:border-primary/50"
                onClick={() => {
                  setSelectedProperty(property);
                  setViewMode("rooms");
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    {property.propertyName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.totalRooms}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.availableRooms}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{stats.filledRooms}</p>
                      <p className="text-xs text-muted-foreground">Filled</p>
                    </div>
                  </div>
                  
                  {/* Room Type Breakdown */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Room Types</p>
                    <div className="space-y-2">
                      {property.rooms.map((room) => (
                        <div key={room.roomId} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{room.roomName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">{room.availableRooms}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-red-600">{room.filledRooms}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {properties.length === 0 && (
            <div className="col-span-full">
              <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No properties found</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Room Detail View */}
      {viewMode === "rooms" && selectedProperty && (
        <div className="space-y-4">
          {/* Back Button */}
          <Button variant="outline" onClick={() => setViewMode("overview")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>

          {/* Property Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                {selectedProperty.propertyName}
              </h2>
              <p className="text-muted-foreground">{formatDate(selectedDate)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {selectedProperty.rooms.reduce((s, r) => s + r.availableRooms, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {selectedProperty.rooms.reduce((s, r) => s + r.filledRooms, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Booked</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {selectedProperty.rooms.reduce((s, r) => s + r.totalRooms, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Room Types Grid */}
          {selectedProperty.rooms.map((room) => (
            <Card key={room.roomId} className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-primary" />
                    {room.roomName}
                  </div>
                  <Badge variant="outline">{room.roomType}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Room Grid Visualization */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Room Status Grid:</span>
                    <span className="text-xs text-muted-foreground">
                      ({room.availableRooms} available / {room.filledRooms} booked / {room.totalRooms} total)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: room.totalRooms }).map((_, idx) => {
                      const isBooked = idx < room.filledRooms;
                      const booking = room.bookings[idx];
                      
                      return (
                        <div
                          key={idx}
                          className={`
                            w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                            ${isBooked 
                              ? "bg-red-100 text-red-700 border-2 border-red-300 cursor-pointer hover:bg-red-200" 
                              : "bg-green-100 text-green-700 border-2 border-green-300 cursor-pointer hover:bg-green-200"
                            }
                          `}
                          title={isBooked ? `Guest: ${booking?.guestName || 'Guest'}` : "Available"}
                        >
                          {idx + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Booking Details */}
                {room.bookings.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Current Bookings ({room.bookings.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {room.bookings.map((booking) => (
                        <div 
                          key={booking.bookingId}
                          className="p-3 rounded-lg bg-red-50 border border-red-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-sm">{booking.guestName}</span>
                            <Badge 
                              className={booking.status === "CHECKED_IN" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-green-100 text-green-700"
                              }
                            >
                              {booking.status === "CHECKED_IN" ? "Checked In" : "Confirmed"}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              #{booking.bookingNumber}
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {booking.phone || "No phone"}
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {room.bookings.length === 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">All rooms available for this type</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {selectedProperty.rooms.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No rooms configured for this property</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorInventory;
