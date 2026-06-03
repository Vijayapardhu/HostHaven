import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  ToggleLeft,
  ToggleRight,
  X,
  ChevronLeft,
  ChevronRight,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roomsService } from "@/lib/rooms";
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
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Keyboard navigation for gallery
  const getRoomImageUrl = (img: any) => typeof img === 'string' ? img : img?.url;

  const roomImageUrls = room?.images?.map(getRoomImageUrl).filter(Boolean) || [];

  useEffect(() => {
    if (!showGallery || roomImageUrls.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowGallery(false);
      if (e.key === "ArrowLeft") setCurrentImageIndex((prev) => (prev - 1 + roomImageUrls.length) % roomImageUrls.length);
      if (e.key === "ArrowRight") setCurrentImageIndex((prev) => (prev + 1) % roomImageUrls.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGallery, roomImageUrls]);

  const fetchRoom = async () => {
    try {
      const response = await roomsService.getRoomById(id!);
      if (response) {
        setRoom(response);
        setFormData({
          name: response.name,
          type: response.type,
          basePrice: response.basePrice?.toString() || response.pricePerNight?.toString() || "0",
          maxOccupancy: response.maxOccupancy?.toString() || response.capacity?.toString() || "0",
          totalRooms: response.totalRooms?.toString() || "1",
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
      await roomsService.updateRoom(id!, {
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
      await roomsService.updateRoom(id!, { isActive: !room?.isActive });
      setRoom((prev) => prev ? { ...prev, isActive: !prev.isActive } : null);
      toast({ title: room?.isActive ? "Room deactivated" : "Room activated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await roomsService.deleteRoom(id!);
      toast({ title: "Room deleted" });
      navigate("/rooms");
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
        <Button variant="link" onClick={() => navigate("/rooms")}>Back to Rooms</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold">{room.name}</h1>
          <p className="text-muted-foreground">{room.property.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/rooms/${id}/edit`)}>
            <Edit className="w-4 h-4" />Edit Room
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Room Images */}
      {roomImageUrls.length > 0 && (
        <div className="relative">
          <div className="grid grid-cols-4 gap-2">
            {roomImageUrls.slice(0, 4).map((imgUrl, idx) => (
              <div 
                key={idx} 
                className="aspect-video rounded-lg overflow-hidden cursor-pointer"
                onClick={() => { setShowGallery(true); setCurrentImageIndex(idx); }}
              >
                <img src={imgUrl} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {roomImageUrls.length > 4 && (
              <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center cursor-pointer" onClick={() => { setShowGallery(true); setCurrentImageIndex(4); }}>
                <span className="text-slate-600 font-semibold">+{roomImageUrls.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      )}

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
                <a href={`/pos?room=${room.id}`}>
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
              <Button variant="link" className="px-0" onClick={() => navigate(`/properties/${room.property.id}`)}>
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

      {/* Image Gallery Modal */}
      {showGallery && roomImageUrls.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setShowGallery(false)}>
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + roomImageUrls.length) % roomImageUrls.length); }}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % roomImageUrls.length); }}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <img 
            src={roomImageUrls[currentImageIndex]} 
            alt={`Room ${currentImageIndex + 1}`} 
            className="max-w-full max-h-full object-contain" 
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {roomImageUrls.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? "w-8 bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
            {currentImageIndex + 1} / {roomImageUrls.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRoomDetail;
