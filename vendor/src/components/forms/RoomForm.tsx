import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Play, Loader2, Video, Image as ImageIcon } from "lucide-react";
import { vendorService } from "@/lib/vendor";

export interface RoomFormValues {
  propertyId: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  extraBedCapacity: number;
  pricePerNight: string;
  weekendPrice: string;
  amenities: string[];
  totalRooms: number;
  images: any[];
  video: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

interface RoomFormProps {
  initialValues?: Partial<RoomFormValues>;
  properties: PropertyOption[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const amenitiesList = [
  "wifi",
  "ac",
  "tv",
  "mini-bar",
  "balcony",
  "ocean-view",
  "king-bed",
  "twin-beds",
  "breakfast",
  "room-service",
];

const defaultValues: RoomFormValues = {
  propertyId: "",
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
  video: "",
};

const RoomForm = ({
  initialValues,
  properties,
  submitting = false,
  submitLabel = "Save Room",
  onSubmit,
  onCancel,
}: RoomFormProps) => {
  const [values, setValues] = useState<RoomFormValues>({
    ...defaultValues,
    ...initialValues,
  });
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const handleAmenityToggle = (amenity: string) => {
    setValues((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    try {
      const result = await vendorService.uploadImage(file, "hosthaven/rooms");
      if (result?.url) {
        setValues((prev) => ({ ...prev, video: result.url }));
      }
    } catch (error) {
      console.error("Video upload failed:", error);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    setValues((prev) => ({ ...prev, video: "" }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const result = await vendorService.uploadImage(file, "hosthaven/rooms");
          return { url: result.url, alt: file.name, isPrimary: false };
        })
      );
      setValues((prev) => {
        const hasPrimary = prev.images.some(img => img.isPrimary);
        if (!hasPrimary && uploadedImages.length > 0) {
          uploadedImages[0].isPrimary = true;
        }
        return { ...prev, images: [...prev.images, ...uploadedImages] };
      });
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setValues((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (prev.images[index]?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index: number) => {
    setValues((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="room-property">Hotel *</Label>
        <select
          id="room-property"
          title="Select hotel"
          aria-label="Select hotel"
          className="w-full p-2 border rounded-md bg-background"
          value={values.propertyId}
          onChange={(event) => setValues((prev) => ({ ...prev, propertyId: event.target.value }))}
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
          <Label htmlFor="room-name">Room Name *</Label>
          <Input
            id="room-name"
            value={values.name}
            onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g., Deluxe Suite"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room-type">Room Type *</Label>
          <select
            id="room-type"
            title="Select room type"
            aria-label="Select room type"
            className="w-full p-2 border rounded-md bg-background"
            value={values.type}
            onChange={(event) => setValues((prev) => ({ ...prev, type: event.target.value }))}
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
          <Label htmlFor="room-capacity">Capacity *</Label>
          <Input
            id="room-capacity"
            type="number"
            min={1}
            max={10}
            value={values.capacity}
            onChange={(event) => setValues((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room-total">Total Rooms *</Label>
          <Input
            id="room-total"
            type="number"
            min={1}
            max={100}
            value={values.totalRooms}
            onChange={(event) => setValues((prev) => ({ ...prev, totalRooms: Number(event.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="room-price">Price per Night (₹) *</Label>
          <Input
            id="room-price"
            type="number"
            value={values.pricePerNight}
            onChange={(event) => setValues((prev) => ({ ...prev, pricePerNight: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room-weekend">Weekend Price (₹)</Label>
          <Input
            id="room-weekend"
            type="number"
            value={values.weekendPrice}
            onChange={(event) => setValues((prev) => ({ ...prev, weekendPrice: event.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="room-description">Description</Label>
        <Textarea
          id="room-description"
          rows={3}
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Room description..."
        />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {amenitiesList.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2">
              <Checkbox
                checked={values.amenities.includes(amenity)}
                onCheckedChange={() => handleAmenityToggle(amenity)}
              />
              <span className="text-sm capitalize">{amenity.replace("-", " ")}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Room Images (No Limit)</Label>
        <input
          ref={imagesInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {values.images.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {values.images.map((img, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden aspect-square border">
                <img src={img.url} alt={img.alt || `Room ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {img.isPrimary && (
                  <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    ★ Primary
                  </span>
                )}
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(index)}
                    className="absolute bottom-1 right-1 bg-white/80 text-gray-700 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                  >
                    Set ★
                  </button>
                )}
              </div>
            ))}
            <label className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition flex items-center justify-center aspect-square">
              <div className="text-center">
                <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div 
            onClick={() => imagesInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition"
          >
            {isUploadingImages ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload room images</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to select multiple images
                </p>
              </>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Upload multiple room images. First image is set as primary by default.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Room Video Tour</Label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleVideoUpload}
          className="hidden"
        />
        
        {values.video ? (
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <video 
              src={values.video} 
              className="w-full h-48 object-cover"
              controls
              preload="metadata"
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              <Play className="w-3 h-3 inline mr-1" />
              Video uploaded
            </div>
          </div>
        ) : (
          <div 
            onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition"
          >
            {isUploadingVideo ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Uploading video...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload room video</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to capture or select video
                </p>
              </>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Upload a video tour of this room. Users can watch before booking.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default RoomForm;
