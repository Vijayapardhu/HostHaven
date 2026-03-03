import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Ban, Plus, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { vendorService } from "@/lib/vendor";
import { roomsService } from "@/lib/rooms";
import { inventoryService, type InventoryItem } from "@/lib/inventory";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";

interface Property {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  propertyId: string;
}

const VendorInventory = () => {
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustDate, setAdjustDate] = useState("");
  const [adjustRooms, setAdjustRooms] = useState<number | "">("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await vendorService.getProperties();
      const list = (response?.data || response || []).map((p: any) => ({
        id: p.id,
        name: p.name,
      }));
      setProperties(list);
      if (list.length > 0) {
        setSelectedPropertyId(list[0].id);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    }
  };

  const fetchRooms = async (propertyId: string) => {
    try {
      const response = await roomsService.getRooms(propertyId);
      const list = (
        Array.isArray(response) ? response : response?.rooms || []
      ).map((r: any) => ({
        id: r.id,
        name: r.name,
        propertyId: r.propertyId,
      }));
      setRooms(list);
      if (list.length > 0) {
        setSelectedRoomId(list[0].id);
      } else {
        setSelectedRoomId("");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    }
  };

  const fetchInventory = async () => {
    if (!selectedRoomId) {
      setInventory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-01`;

      const response = await inventoryService.getInventory(
        selectedRoomId,
        dateStr,
      );
      const inventoryArray = Array.isArray(response)
        ? response
        : response?.inventory || [];
      setInventory(inventoryArray);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      void fetchRooms(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    void fetchInventory();
  }, [currentDate, selectedRoomId]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () =>
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();
  const getFirstDayOfMonth = () =>
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleBlockDates = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedRoomId || !blockStartDate || !blockEndDate) {
      toast({
        title: "Missing required fields",
        description: "Room and date range are required",
        variant: "destructive",
      });
      return;
    }

    setIsBlocking(true);
    try {
      await inventoryService.block({
        roomId: selectedRoomId,
        startDate: blockStartDate,
        endDate: blockEndDate,
        reason: blockReason || undefined,
      });

      toast({
        title: "Dates blocked",
        description: "Rooms have been blocked successfully",
      });
      setIsBlockDialogOpen(false);
      setBlockStartDate("");
      setBlockEndDate("");
      setBlockReason("");
      void fetchInventory();
    } catch (error: any) {
      toast({
        title: "Failed to block dates",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleAdjustRooms = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedRoomId || !adjustDate || !adjustRooms || adjustRooms < 0) {
      toast({
        title: "Invalid input",
        description: "Please provide valid room count",
        variant: "destructive",
      });
      return;
    }

    setIsAdjusting(true);
    try {
      await inventoryService.updateInventory({
        roomId: selectedRoomId,
        date: adjustDate,
        availableRooms: Number(adjustRooms),
      });

      toast({
        title: "Inventory updated",
        description: "Available rooms have been updated",
      });
      setIsAdjustDialogOpen(false);
      setAdjustDate("");
      setAdjustRooms("");
      void fetchInventory();
    } catch (error: any) {
      toast({
        title: "Failed to update inventory",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const openAdjustDialog = (date: string) => {
    const dayData = inventory.find((d) => d.date === date);
    setAdjustDate(date);
    setAdjustRooms(dayData?.availableRooms ?? 0);
    setIsAdjustDialogOpen(true);
  };

  const getDayData = (dateStr: string) =>
    inventory.find((d) => d.date === dateStr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage room availability and block dates
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
          >
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
          <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsBlockDialogOpen(true)}
            disabled={!selectedRoomId}
          >
            <Ban className="w-4 h-4 mr-2" />
            Block Dates
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading inventory..." />
      ) : !selectedRoomId ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              Select a room to view inventory
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-[100px]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                const dayData = getDayData(dateStr);
                const isToday =
                  new Date().toISOString().split("T")[0] === dateStr;
                const isPast =
                  new Date(dateStr) < new Date(new Date().toDateString());

                const total = dayData?.totalRooms ?? 0;
                const booked = dayData?.bookedRooms ?? 0;
                const available = dayData?.availableRooms ?? 0;
                const isBlocked = dayData?.isBlocked ?? false;

                let bgColor = "bg-gray-50";
                if (isPast) {
                  bgColor = "bg-gray-100";
                } else if (isBlocked) {
                  bgColor = "bg-red-100";
                } else if (total > 0) {
                  const occupancy = booked / total;
                  if (occupancy >= 0.9) bgColor = "bg-red-100";
                  else if (occupancy >= 0.7) bgColor = "bg-amber-100";
                  else if (occupancy >= 0.5) bgColor = "bg-yellow-100";
                  else bgColor = "bg-green-100";
                }

                return (
                  <div
                    key={day}
                    className={`min-h-[100px] p-2 rounded-lg border ${isToday ? "ring-2 ring-primary" : ""} ${bgColor} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-semibold ${isToday ? "text-primary" : ""} ${isPast ? "text-muted-foreground" : ""}`}
                      >
                        {day}
                      </span>
                      {isBlocked && <Ban className="w-3 h-3 text-red-500" />}
                    </div>
                    {total > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Available
                          </span>
                          <span
                            className={`font-medium ${available === 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {available}/{total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Booked</span>
                          <span className="font-medium">{booked}</span>
                        </div>
                        {!isPast && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 h-6 text-xs"
                            onClick={() => openAdjustDialog(dateStr)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Adjust
                          </Button>
                        )}
                      </div>
                    ) : (
                      !isPast && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-6 text-xs"
                          onClick={() => openAdjustDialog(dateStr)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Set
                        </Button>
                      )
                    )}
                    {isBlocked && dayData?.blockReason && (
                      <p
                        className="text-xs text-red-600 mt-1 truncate"
                        title={dayData.blockReason}
                      >
                        {dayData.blockReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Dates</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBlockDates} className="space-y-4">
            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                value={rooms.find((r) => r.id === selectedRoomId)?.name || ""}
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blockStartDate">Start Date</Label>
                <Input
                  id="blockStartDate"
                  type="date"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blockEndDate">End Date</Label>
                <Input
                  id="blockEndDate"
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blockReason">Reason (optional)</Label>
              <Textarea
                id="blockReason"
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Maintenance, private event, etc."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBlockDialogOpen(false)}
                disabled={isBlocking}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBlocking}>
                {isBlocking ? "Blocking..." : "Block Dates"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Available Rooms</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustRooms} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={adjustDate} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustRooms">Available Rooms</Label>
              <Input
                id="adjustRooms"
                type="number"
                min="0"
                value={adjustRooms}
                onChange={(e) =>
                  setAdjustRooms(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdjustDialogOpen(false)}
                disabled={isAdjusting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAdjusting}>
                {isAdjusting ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorInventory;
