import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vendorService } from "@/lib/vendor";
import { getFieldHint, validateField } from "@/lib/formValidation";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";

const amenitiesList = [
  "wifi", "parking", "pool", "gym", "restaurant", "room-service", "ac", "tv",
  "laundry", "kitchen", "garden", "balcony", "mini-bar", "coffee-maker",
  "spa", "bar", "business-center", "airport-shuttle"
];

const states = ["Andhra Pradesh", "Telangana"];

const VendorPropertyNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; file?: File; isPrimary?: boolean }>>([]);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDesc: "",
    type: "HOTEL" as "HOTEL" | "HOME" | "TEMPLE",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    basePrice: "",
    amenities: [] as string[],
    highlights: [] as string[],
  });

  useEffect(() => {
    vendorService.getCities()
      .then(setCities)
      .catch(() => setCities(["VIJAYAWADA", "NANDIYALA", "VETLAPALEM", "TIRUPATI"]));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const result = await vendorService.uploadImage(file, "hosthaven/properties");
          return { url: result.url, file, isPrimary: false };
        })
      );
      setImages((prev) => {
        const hasPrimary = prev.some(img => img.isPrimary);
        if (!hasPrimary && uploadedImages.length > 0) {
          uploadedImages[0].isPrimary = true;
        }
        return [...prev, ...uploadedImages];
      });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationChecks: Array<[string, string, string]> = [
      ["name", "propertyName", formData.name],
      ["description", "propertyDescription", formData.description],
      ["address", "address", formData.address],
      ["pincode", "pincode", formData.pincode],
    ];

    const nextErrors: Record<string, string> = {};
    validationChecks.forEach(([stateKey, ruleKey, value]) => {
      const result = validateField(ruleKey, value);
      if (!result.valid) nextErrors[stateKey] = result.errors[0];
    });

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: "Please correct highlighted fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const propertyData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        basePrice: parseFloat(formData.basePrice),
        images: images.map((img) => ({
          url: img.url,
          isPrimary: img.isPrimary || false,
        })),
      };

      const result = await vendorService.createProperty(propertyData);
      toast({ title: "Property created successfully" });
      navigate(`/properties/${result.slug}`);
    } catch (error: any) {
      toast({
        title: "Failed to create property",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/properties")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Property</h1>
          <p className="text-muted-foreground">Create a new hotel, home, or temple stay</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, name: value });
                    if (fieldErrors.name) {
                      const result = validateField("propertyName", value);
                      setFieldErrors((prev) => ({ ...prev, name: result.valid ? "" : (result.errors[0] || "Invalid property name") }));
                    }
                  }}
                  placeholder="Enter property name"
                  minLength={2}
                  maxLength={200}
                  required
                />
                {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : <p className="text-xs text-muted-foreground">{getFieldHint("propertyName")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "HOTEL" | "HOME" | "TEMPLE") => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL">Hotel</SelectItem>
                    <SelectItem value="HOME">Home Stay</SelectItem>
                    <SelectItem value="TEMPLE">Temple Stay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, description: value });
                  if (fieldErrors.description) {
                    const result = validateField("propertyDescription", value);
                    setFieldErrors((prev) => ({ ...prev, description: result.valid ? "" : (result.errors[0] || "Invalid description") }));
                  }
                }}
                placeholder="Describe your property"
                rows={4}
                minLength={10}
                maxLength={5000}
                required
              />
              {fieldErrors.description ? <p className="text-xs text-destructive">{fieldErrors.description}</p> : <p className="text-xs text-muted-foreground">{getFieldHint("propertyDescription")}</p>}
              <p className="text-xs text-muted-foreground text-right">{formData.description.length}/5000</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDesc">Short Description</Label>
              <Input
                id="shortDesc"
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                placeholder="Brief summary for listings"
                maxLength={200}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, address: value });
                  if (fieldErrors.address) {
                    const result = validateField("address", value);
                    setFieldErrors((prev) => ({ ...prev, address: result.valid ? "" : (result.errors[0] || "Invalid address") }));
                  }
                }}
                placeholder="Street address"
                minLength={5}
                maxLength={500}
                required
              />
              {fieldErrors.address ? <p className="text-xs text-destructive">{fieldErrors.address}</p> : <p className="text-xs text-muted-foreground">{getFieldHint("address")}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, pincode: value });
                    if (fieldErrors.pincode) {
                      const result = validateField("pincode", value);
                      setFieldErrors((prev) => ({ ...prev, pincode: result.valid ? "" : (result.errors[0] || "Invalid pincode") }));
                    }
                  }}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                {fieldErrors.pincode ? <p className="text-xs text-destructive">{fieldErrors.pincode}</p> : <p className="text-xs text-muted-foreground">{getFieldHint("pincode")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (₹) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="1000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="17.6868"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="83.2185"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="images" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    <Upload className="w-4 h-4" />
                    Upload Images
                  </div>
                </Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <span className="text-muted-foreground">Uploading...</span>}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border">
                      <img src={img.url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {img.isPrimary && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs rounded font-medium">
                          ★ Primary
                        </span>
                      )}
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className="absolute bottom-2 right-2 px-2 py-1 bg-white/80 text-gray-700 text-xs rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set ★
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/properties")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Creating..." : "Create Property"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VendorPropertyNew;
