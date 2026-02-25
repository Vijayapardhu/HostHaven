import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const handleAmenityToggle = (amenity: string) => {
    setValues((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
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
