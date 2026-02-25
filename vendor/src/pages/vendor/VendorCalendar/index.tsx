import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { vendorService } from "@/lib/vendor";
import { inventoryService } from "@/lib/inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";

interface PropertyOption {
  id: string;
  name: string;
}

interface DayData {
  date: string;
  totalRooms: number;
  availableRooms: number;
  filledRooms: number;
}

const VendorCalendarIndex = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [availability, setAvailability] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      const response = await vendorService.getProperties();
      const list = (response?.properties || []).map((p: any) => ({ id: p.id, name: p.name }));
      setProperties(list);

      if (list.length > 0) {
        setSelectedPropertyId(list[0].id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load properties", variant: "destructive" });
    }
  };

  const fetchAvailability = async () => {
    if (!selectedPropertyId) {
      return;
    }

    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-01`;

      const response = await inventoryService.getRoomInventory(dateStr);
      const inventoryArray = Array.isArray(response) ? response : response?.inventory || [];

      setAvailability(inventoryArray);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to load availability", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProperties();
  }, []);

  useEffect(() => {
    void fetchAvailability();
  }, [currentDate, selectedPropertyId]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Availability Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage room availability</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/vendor/calendar/block-dates")}>Block Dates</Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading calendar..." />
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{monthName}</CardTitle>
            <div className="flex gap-2">
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
              {weekdays.map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-[80px]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                const dayData = availability.find((d) => d.date === dateStr);
                const isToday = new Date().toISOString().split("T")[0] === dateStr;

                const total = dayData?.totalRooms || 0;
                const available = dayData?.availableRooms || 0;
                const occupancy = total > 0 ? (total - available) / total : 0;

                let bgColor = "bg-gray-50";
                if (total > 0) {
                  if (occupancy >= 0.9) bgColor = "bg-red-100";
                  else if (occupancy >= 0.7) bgColor = "bg-amber-100";
                  else if (occupancy >= 0.5) bgColor = "bg-yellow-100";
                  else bgColor = "bg-green-100";
                }

                return (
                  <div
                    key={day}
                    className={`min-h-[80px] p-2 rounded-lg border ${isToday ? "ring-2 ring-primary" : ""} ${bgColor}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{day}</span>
                      {total > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {available}/{total}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorCalendarIndex;
