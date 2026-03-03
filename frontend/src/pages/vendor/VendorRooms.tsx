import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BedDouble,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Upload,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  description?: string;
  type: string;
  capacity: number;
  extraBedCapacity: number;
  pricePerNight: number;
  amenities: string[];
  images: any[];
  totalRooms: number;
  availableRooms: number;
  isActive: boolean;
}

interface Property {
  id: string;
  name: string;
}

const amenitiesList = [
  "wifi", "ac", "tv", "mini-bar", "balcony", "ocean-view",
  "king-bed", "twin-beds", "breakfast", "room-service"
];

const VendorRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "standard",
    description: "",
    capacity: 2,
    extraBedCapacity: 0,
    pricePerNight: "",
    weekendPrice: "",
    amenities: [] as string[],
    totalRooms: 1,
    images: [] as any[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const props = await api.vendor.getProperties();
      setProperties(props.data || []);
      
      if (props.data && props.data.length > 0) {
        setSelectedProperty(props.data[0].id);
        const roomsData = await api.vendor.getRooms(props.data[0].id);
        setRooms(roomsData || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async (propertyId: string) => {
    try {
      const roomsData = await api.vendor.getRooms(propertyId);
      setRooms(roomsData || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId);
    fetchRooms(propertyId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty) {
      toast({ title: "Please select a hotel", variant: "destructive" });
      return;
    }

    try {
      await api.vendor.createRoom({
        propertyId: selectedProperty,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        capacity: formData.capacity,
        extraBedCapacity: formData.extraBedCapacity,
        pricePerNight: parseFloat(formData.pricePerNight),
        weekendPrice: formData.weekendPrice ? parseFloat(formData.weekendPrice) : undefined,
        amenities: formData.amenities,
        totalRooms: formData.totalRooms,
        availableRooms: formData.totalRooms,
        images: formData.images,
      });

      toast({ title: "Room created successfully" });
      setIsCreateOpen(false);
      fetchRooms(selectedProperty);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create room", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "standard",
      description: "",
      capacity: 2,
      extraBedCapacity: 0,
      pricePerNight: "",
      weekendPrice: "",
      amenities: [],
      totalRooms: 1,
      images: [],
    });
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await api.vendor.deleteRoom(id);
      toast({ title: "Room deleted" });
      if (selectedProperty) fetchRooms(selectedProperty);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage rooms for your hotels
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Property Select */}
              <div className="space-y-2">
                <Label>Hotel *</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  required
                >
                  <option value="">Select hotel</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Name *</Label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Deluxe Suite" required />
                </div>
                <div className="space-y-2">
                  <Label>Room Type *</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    name="type"
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                    <option value="family">Family</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity *</Label>
                  <Input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} min={1} max={10} required />
                </div>
                <div className="space-y-2">
                  <Label>Total Rooms *</Label>
                  <Input type="number" name="totalRooms" value={formData.totalRooms} onChange={handleInputChange} min={1} max={50} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price per Night (₹) *</Label>
                  <Input type="number" name="pricePerNight" value={formData.pricePerNight} onChange={handleInputChange} placeholder="2500" required />
                </div>
                <div className="space-y-2">
                  <Label>Weekend Price (₹)</Label>
                  <Input type="number" name="weekendPrice" value={formData.weekendPrice} onChange={handleInputChange} placeholder="3000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Room description..." rows={3} />
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {amenitiesList.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => handleAmenityToggle(amenity)}
                      />
                      <span className="text-sm capitalize">{amenity.replace("-", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit">Create Room</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Property Filter */}
      <div className="flex gap-4">
        <select
          className="p-2 border rounded-md"
          value={selectedProperty}
          onChange={(e) => handlePropertyChange(e.target.value)}
        >
          <option value="">Select hotel</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{room.type}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteRoom(room.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{room.capacity} Guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BedDouble className="w-4 h-4 text-muted-foreground" />
                      <span>{room.totalRooms} Rooms</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-lg font-bold">₹{room.pricePerNight.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                    <Badge variant={room.isActive ? "default" : "secondary"}>
                      {room.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BedDouble className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Rooms Found</h3>
            <p className="text-muted-foreground text-center">
              Add rooms to your hotel to start receiving bookings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorRooms;
