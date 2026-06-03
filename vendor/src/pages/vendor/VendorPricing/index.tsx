import { useState, useEffect } from "react";
import { DollarSign, Calendar, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vendorService } from "@/lib/vendor";
import { roomsService } from "@/lib/rooms";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";
import EmptyState from "@/components/states/EmptyState";

interface Property {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  pricePerNight: number;
  weekendPrice: number | null;
  seasonalPricing: Array<{
    startDate: string;
    endDate: string;
    price: number;
  }> | null;
}

const VendorPricing = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    pricePerNight: "",
    weekendPrice: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchRooms(selectedProperty);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const response = await vendorService.getProperties();
      const list = (response?.data || response || []).map((p: any) => ({
        id: p.id,
        name: p.name,
      }));
      setProperties(list);
      if (list.length > 0) {
        setSelectedProperty(list[0].id);
      }
    } catch (error) {
      toast({ title: "Failed to load properties", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async (propertyId: string) => {
    try {
      const response = await roomsService.getRooms(propertyId);
      setRooms(Array.isArray(response) ? response : response?.rooms || []);
    } catch (error) {
      toast({ title: "Failed to load rooms", variant: "destructive" });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room.id);
    setEditForm({
      pricePerNight: room.pricePerNight.toString(),
      weekendPrice: room.weekendPrice?.toString() || "",
    });
  };

  const handleSave = async (roomId: string) => {
    try {
      const parsedPricePerNight = Number(editForm.pricePerNight);
      const parsedWeekendPrice = editForm.weekendPrice === "" ? undefined : Number(editForm.weekendPrice);

      if (!Number.isFinite(parsedPricePerNight) || parsedPricePerNight <= 0) {
        toast({ title: "Invalid base price", description: "Base price must be greater than 0", variant: "destructive" });
        return;
      }

      if (parsedWeekendPrice !== undefined && (!Number.isFinite(parsedWeekendPrice) || parsedWeekendPrice < 0)) {
        toast({ title: "Invalid weekend price", description: "Weekend price cannot be negative", variant: "destructive" });
        return;
      }

      await roomsService.updateRoom(roomId, {
        pricePerNight: parsedPricePerNight,
        weekendPrice: parsedWeekendPrice,
      });
      toast({ title: "Price updated successfully" });
      setEditingRoom(null);
      fetchRooms(selectedProperty);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "Failed to update price";
      toast({ title: "Failed to update price", description: message, variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setEditingRoom(null);
    setEditForm({ pricePerNight: "", weekendPrice: "" });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No Properties"
        description="Add a property first to manage pricing"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Room Pricing</h1>
        <p className="text-muted-foreground">Manage base prices, weekend rates, and seasonal pricing</p>
      </div>

      <div className="flex items-center gap-4">
        <Label htmlFor="vendor-pricing-property">Select Property:</Label>
        <select
          id="vendor-pricing-property"
          title="Select Property"
          aria-label="Select Property"
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="base" className="space-y-4">
        <TabsList>
          <TabsTrigger value="base">Base Pricing</TabsTrigger>
          <TabsTrigger value="weekend">Weekend Pricing</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="base">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Base Nightly Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-muted-foreground">{room.type}</p>
                    </div>
                    {editingRoom === room.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editForm.pricePerNight}
                          onChange={(e) => setEditForm({ ...editForm, pricePerNight: e.target.value })}
                          className="w-32"
                        />
                        <Button size="sm" onClick={() => handleSave(room.id)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">₹{room.pricePerNight}</span>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekend Rates (Fri-Sun)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-muted-foreground">{room.type}</p>
                    </div>
                    {editingRoom === room.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Optional"
                          value={editForm.weekendPrice}
                          onChange={(e) => setEditForm({ ...editForm, weekendPrice: e.target.value })}
                          className="w-32"
                        />
                        <Button size="sm" onClick={() => handleSave(room.id)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">
                          {room.weekendPrice ? `₹${room.weekendPrice}` : <span className="text-muted-foreground">Not set</span>}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Seasonal pricing configuration coming soon. Contact support for custom pricing rules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorPricing;
