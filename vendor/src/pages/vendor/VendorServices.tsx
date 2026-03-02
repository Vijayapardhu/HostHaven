import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Upload,
  X,
  Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceUnit: string;
  images: Array<{ url: string }>;
  duration: string;
  isActive: boolean;
  rating: number;
  reviewCount: number;
}

const serviceCategories = [
  { value: "transport", label: "Transport" },
  { value: "guide", label: "Tour Guide" },
  { value: "photography", label: "Photography" },
  { value: "catering", label: "Catering" },
  { value: " Event", label: "Event Planning" },
  { value: "other", label: "Other" },
];

const VendorServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    priceUnit: "per_person",
    duration: "",
    images: [] as Array<{ url: string }>,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      setServices([]);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedImages = await Promise.all(
        Array.from(files).map(async (file) => {
          const result = await vendorService.uploadImage(file, "hosthaven/services");
          return { url: result.url };
        })
      );

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));

      toast({ title: "Images uploaded" });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast({ title: "Service created successfully" });
      setIsCreateOpen(false);
      fetchServices();
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      priceUnit: "per_person",
      duration: "",
      images: [],
    });
  };

  const handleToggleActive = async (service: Service) => {
    try {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
      );
      toast({ title: service.isActive ? "Service deactivated" : "Service activated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      toast({ title: "Service deleted" });
      fetchServices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      transport: "bg-blue-100 text-blue-700",
      guide: "bg-green-100 text-green-700",
      photography: "bg-purple-100 text-purple-700",
      catering: "bg-orange-100 text-orange-700",
      event: "bg-pink-100 text-pink-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Travel Services</h1>
          <p className="text-muted-foreground mt-1">Manage your travel and tourism services</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Name *</Label>
                    <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Airport Pickup" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your service..." rows={3} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹) *</Label>
                    <Input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="500" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Unit</Label>
                    <Select value={formData.priceUnit} onValueChange={(v) => setFormData((p) => ({ ...p, priceUnit: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_person">Per Person</SelectItem>
                        <SelectItem value="per_vehicle">Per Vehicle</SelectItem>
                        <SelectItem value="per_trip">Per Trip</SelectItem>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input name="duration" value={formData.duration} onChange={handleInputChange} placeholder="e.g., 2 hours" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Service Images</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="service-images" disabled={isUploading} />
                    <label htmlFor="service-images" className="cursor-pointer">
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p>Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm">Click to upload images</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden">
                          <img src={img.url} alt="" className="w-full h-20 object-cover" />
                          <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit">Create Service</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-lg">
              <div className="h-40 bg-muted animate-pulse"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service, index) => (
            <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="border-0 shadow-lg overflow-hidden group">
                <div className="aspect-video relative">
                  <img src={service.images[0]?.url || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400"} alt={service.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <Badge className={getCategoryBadge(service.category)}>{service.category}</Badge>
                  </div>
                  {!service.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg">Inactive</Badge>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                      <Button size="sm" variant="secondary"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg truncate">{service.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{service.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <div>
                      <p className="font-bold text-primary">₹{service.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{service.priceUnit.replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={service.isActive} onCheckedChange={() => handleToggleActive(service)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="border-0 shadow-lg col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
              <p className="text-muted-foreground text-center mb-6">Start by adding travel services for your guests</p>
              <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Your First Service</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorServices;
