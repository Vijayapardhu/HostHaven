import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  Image,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Utensils,
  Wind,
  Tv,
  WashingMachine,
  Flame,
  Home,
  Coffee,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

interface PropertyDetail {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  shortDesc: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  basePrice: number;
  amenities: string[];
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  rating: number;
  reviewCount: number;
  totalRooms: number;
  filledRooms: number;
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  restaurant: Utensils,
  "room-service": Coffee,
  ac: Wind,
  tv: Tv,
  laundry: WashingMachine,
  kitchen: Flame,
  garden: Home,
  balcony: Home,
  "mini-bar": Coffee,
  "coffee-maker": Coffee,
};

const VendorPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDesc: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    basePrice: "",
    amenities: [] as string[],
  });

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await vendorService.getPropertyById(id!);
      setProperty(response.property);
      setFormData({
        name: response.property.name,
        description: response.property.description,
        shortDesc: response.property.shortDesc || "",
        address: response.property.address,
        city: response.property.city,
        state: response.property.state,
        pincode: response.property.pincode,
        basePrice: response.property.basePrice.toString(),
        amenities: response.property.amenities || [],
      });
    } catch (error) {
      console.error("Failed to fetch property:", error);
      toast({ title: "Error", description: "Failed to load property", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedImages = await Promise.all(
        Array.from(files).map(async (file) => {
          const result = await vendorService.uploadImage(file, "hosthaven/properties");
          return { url: result.url, alt: file.name, isPrimary: false };
        })
      );

      setProperty((prev) => prev ? {
        ...prev,
        images: [...prev.images, ...uploadedImages]
      } : null);

      toast({ title: "Images uploaded" });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (index: number) => {
    setProperty((prev) => prev ? {
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    } : null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await vendorService.updateProperty(id!, {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
      });
      toast({ title: "Property updated successfully" });
      setIsEditOpen(false);
      fetchProperty();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const amenitiesList = [
    "wifi", "parking", "pool", "gym", "restaurant", "room-service", "ac", "tv",
    "laundry", "kitchen", "garden", "balcony", "mini-bar", "coffee-maker"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Property not found</p>
        <Button variant="link" onClick={() => navigate("/vendor/properties")}>Back to Properties</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/properties")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold">{property.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {property.city}, {property.state}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsEditOpen(true)}>
            <Edit className="w-4 h-4" />Edit Details
          </Button>
          <Button variant="outline" asChild>
            <a href={`/vendor/properties/${property.id}/rooms`}>
              <Building2 className="w-4 h-4 mr-2" />Manage Rooms
            </a>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {property.status === "ACTIVE" ? (
          <Badge className="bg-green-100 text-green-700">Active</Badge>
        ) : property.status === "PENDING" ? (
          <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-700">{property.status}</Badge>
        )}
        <Badge variant="outline">{property.type}</Badge>
        <Badge variant="outline" className="gap-1">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          {property.rating} ({property.reviewCount} reviews)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Property Images
                <div>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="property-images" disabled={isUploading} />
                  <label htmlFor="property-images">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <span><Upload className="w-4 h-4" />Upload</span>
                    </Button>
                  </label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.images.map((img, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        aria-label="Remove image"
                        title="Remove image"
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {img.isPrimary && (
                        <Badge className="absolute bottom-2 left-2 bg-primary text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No images uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{property.description}</p>
              {property.shortDesc && (
                <p className="mt-2 font-medium">{property.shortDesc}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenitiesList.map((amenity) => {
                  const Icon = amenityIcons[amenity] || CheckCircle;
                  const isAvailable = property.amenities?.includes(amenity);
                  return (
                    <div
                      key={amenity}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${isAvailable ? "bg-green-50 border-green-200" : "bg-muted/30"}`}
                    >
                      <Icon className={`w-5 h-5 ${isAvailable ? "text-green-600" : "text-muted-foreground"}`} />
                      <span className={`capitalize ${isAvailable ? "" : "text-muted-foreground"}`}>
                        {amenity.replace("-", " ")}
                      </span>
                      {isAvailable && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Property Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price</span>
                <span className="font-bold">₹{property.basePrice.toLocaleString()}/night</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rooms</span>
                <span className="font-semibold">{property.totalRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filled Rooms</span>
                <span className="font-semibold">{property.filledRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City</span>
                <span className="font-semibold">{property.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State</span>
                <span className="font-semibold">{property.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pincode</span>
                <span className="font-semibold">{property.pincode}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{property.address}</p>
              <p className="text-muted-foreground">{property.city}, {property.state} - {property.pincode}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input value={formData.shortDesc} onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Full Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Base Price (₹)</Label>
              <Input type="number" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={formData.amenities.includes(amenity)} onCheckedChange={() => handleAmenityToggle(amenity)} />
                    <span className="text-sm capitalize">{amenity.replace("-", " ")}</span>
                  </label>
                ))}
              </div>
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

export default VendorPropertyDetail;
