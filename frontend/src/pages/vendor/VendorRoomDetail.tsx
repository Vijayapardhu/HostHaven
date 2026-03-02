import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BedDouble,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Users,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  property: { id: string; name: string };
}

const VendorRoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    basePrice: "",
    maxOccupancy: "",
    totalRooms: "",
  });

  useEffect(() => {
    if (id) fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const response = await api.get<any>(`/rooms/${id}`);
      const foundRoom = response.data ?? response;
      if (foundRoom) {
        setRoom(foundRoom);
        setFormData({
          name: foundRoom.name,
          type: foundRoom.type,
          basePrice: foundRoom.basePrice.toString(),
          maxOccupancy: foundRoom.maxOccupancy.toString(),
          totalRooms: foundRoom.totalRooms.toString(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.vendor.updateRoom(id!, {
        name: formData.name,
        type: formData.type,
        basePrice: parseFloat(formData.basePrice),
        maxOccupancy: parseInt(formData.maxOccupancy),
        totalRooms: parseInt(formData.totalRooms),
      });
      toast({ title: "Room updated successfully" });
      setIsEditOpen(false);
      fetchRoom();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await api.vendor.updateRoom(id!, { isActive: !room?.isActive });
      setRoom((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
      toast({ title: room?.isActive ? "Room deactivated" : "Room activated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.vendor.deleteRoom(id!);
      toast({ title: "Room deleted" });
      navigate("/vendor/rooms");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Room not found</p>
        <Button variant="link" onClick={() => navigate("/vendor/rooms")}>Back to Rooms</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/rooms")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold">{room.name}</h1>
          <p className="text-muted-foreground">{room.property.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsEditOpen(true)}>
            <Edit className="w-4 h-4" />Edit Room
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {room.isActive ? (
          <Badge className="bg-green-100 text-green-700">Active</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
        )}
        <Badge variant="outline">{room.type}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Base Price</span>
                  </div>
                  <p className="text-2xl font-bold">₹{room.basePrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per night</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Max Occupancy</span>
                  </div>
                  <p className="text-2xl font-bold">{room.maxOccupancy}</p>
                  <p className="text-xs text-muted-foreground">guests per room</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{room.totalRooms}</p>
                  <p className="text-sm text-muted-foreground">Total Rooms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{room.availableRooms}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{room.totalRooms - room.availableRooms}</p>
                  <p className="text-sm text-muted-foreground">Occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {room.amenities?.map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="capitalize">
                    {amenity.replace("-", " ")}
                  </Badge>
                ))}
                {!room.amenities?.length && (
                  <p className="text-muted-foreground">No amenities listed</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {room.isActive ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                  <span>Room Active</span>
                </div>
                <Switch checked={room.isActive} onCheckedChange={handleToggleActive} />
              </div>

              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={`/vendor/pos?room=${room.id}`}>
                  <Calendar className="w-4 h-4" />View Availability
                </a>
              </Button>

              <Button variant="outline" className="w-full gap-2">
                <DollarSign className="w-4 h-4" />Manage Pricing
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{room.property.name}</p>
              <Button variant="link" className="px-0" onClick={() => navigate(`/vendor/properties/${room.property.id}`)}>
                View Property
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="DELUXE">Deluxe</SelectItem>
                  <SelectItem value="SUITE">Suite</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="NON_AC">Non-AC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price (₹)</Label>
                <Input type="number" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Occupancy</Label>
                <Input type="number" value={formData.maxOccupancy} onChange={(e) => setFormData({ ...formData, maxOccupancy: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Rooms</Label>
              <Input type="number" value={formData.totalRooms} onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorRoomDetail;
