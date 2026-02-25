import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inventoryService } from "@/lib/inventory";
import { vendorService } from "@/lib/vendor";
import { useNavigate } from "react-router-dom";

interface DayAvailability {
  date: string;
  totalRooms: number;
  availableRooms: number;
  filledRooms: number;
  bookings: Array<{
    bookingId: string;
    guestName: string;
    roomName: string;
    status: string;
  }>;
}

const VendorCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchAvailability();
    }
  }, [currentDate, selectedProperty]);

  const fetchProperties = async () => {
    try {
      const response = await vendorService.getProperties();
      const props = response.properties || [];
      setProperties(props.map((p: any) => ({ id: p.id, name: p.name })));
      if (props.length > 0) {
        setSelectedProperty(props[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await inventoryService.getRoomInventory(`${year}-${month.toString().padStart(2, '0')}-01`);
      
      const days: DayAvailability[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayData = response.find((d: any) => d.date === dateStr);
        
        if (dayData) {
          days.push(dayData);
        } else {
          days.push({
            date: dateStr,
            totalRooms: 0,
            availableRooms: 0,
            filledRooms: 0,
            bookings: [],
          });
        }
      }
      
      setAvailability(days);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getStatusColor = (available: number, total: number) => {
    if (total === 0) return "bg-gray-100";
    const occupancy = (total - available) / total;
    if (occupancy >= 0.9) return "bg-red-100";
    if (occupancy >= 0.7) return "bg-amber-100";
    if (occupancy >= 0.5) return "bg-yellow-100";
    return "bg-green-100";
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const totalAvailable = availability.reduce((sum, d) => sum + d.availableRooms, 0);
  const totalFilled = availability.reduce((sum, d) => sum + d.filledRooms, 0);
  const totalRooms = availability.reduce((sum, d) => sum + d.totalRooms, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Availability Calendar</h1>
          <p className="text-muted-foreground mt-1">View room availability across the month</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/vendor/calendar/block-dates")}>Block Dates</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAvailable}</p>
                <p className="text-sm text-muted-foreground">Total Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFilled}</p>
                <p className="text-sm text-muted-foreground">Total Filled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRooms}</p>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">{monthName}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[100px] p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const dayData = availability.find((d) => d.date === dateStr) || {
                totalRooms: 0,
                availableRooms: 0,
                filledRooms: 0,
                bookings: [],
              };
              
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`min-h-[100px] p-2 rounded-lg border ${isToday ? 'ring-2 ring-primary' : ''} ${getStatusColor(dayData.availableRooms, dayData.totalRooms)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${isToday ? 'text-primary' : ''}`}>{day}</span>
                    {dayData.totalRooms > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {dayData.availableRooms}/{dayData.totalRooms}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayData.bookings.slice(0, 2).map((booking, i) => (
                      <div key={i} className="text-xs truncate">
                        <span className="font-medium">{booking.guestName}</span>
                      </div>
                    ))}
                    {dayData.bookings.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{dayData.bookings.length - 2} more</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100"></div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100"></div>
              <span className="text-sm text-muted-foreground">50-70%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100"></div>
              <span className="text-sm text-muted-foreground">70-90%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100"></div>
              <span className="text-sm text-muted-foreground">90-100%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorCalendar;
