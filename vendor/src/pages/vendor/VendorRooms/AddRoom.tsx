import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoomForm, { RoomFormValues } from "@/components/forms/RoomForm";
import { roomsService } from "@/lib/rooms";
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

interface PropertyOption {
  id: string;
  name: string;
}

const AddRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await vendorService.getProperties();
        setProperties((response.properties || []).map((p: any) => ({ id: p.id, name: p.name })));
      } catch {
        toast({ title: "Error", description: "Failed to load hotels", variant: "destructive" });
      }
    };

    fetchProperties();
  }, [toast]);

  const handleSubmit = async (values: RoomFormValues) => {
    if (!values.propertyId) {
      toast({ title: "Please select a hotel", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await roomsService.createRoom({
        propertyId: values.propertyId,
        name: values.name,
        type: values.type,
        description: values.description,
        capacity: values.capacity,
        extraBedCapacity: values.extraBedCapacity,
        pricePerNight: parseFloat(values.pricePerNight),
        weekendPrice: values.weekendPrice ? parseFloat(values.weekendPrice) : undefined,
        amenities: values.amenities,
        totalRooms: values.totalRooms,
        availableRooms: values.totalRooms,
        images: values.images,
      });

      toast({ title: "Room created successfully" });
      navigate("/vendor/rooms");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create room", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Add Room</CardTitle>
      </CardHeader>
      <CardContent>
        <RoomForm
          properties={properties}
          submitLabel="Create Room"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/vendor/rooms")}
        />
      </CardContent>
    </Card>
  );
};

export default AddRoom;
