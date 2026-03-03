import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoomForm, { RoomFormValues } from "@/components/forms/RoomForm";
import { roomsService } from "@/lib/rooms";
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

interface PropertyOption {
  id: string;
  name: string;
}

interface RoomRecord {
  id: string;
  name: string;
  type: string;
  description?: string;
  capacity: number;
  extraBedCapacity?: number;
  pricePerNight?: number;
  basePrice?: number;
  totalRooms: number;
  amenities?: string[];
  images?: any[];
  property?: { id: string };
}

const EditRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertiesResponse = await vendorService.getProperties();
        const propertyOptions = (propertiesResponse.data || propertiesResponse || []).map((p: any) => ({ id: p.id, name: p.name }));
        setProperties(propertyOptions);

        let foundRoom: RoomRecord | null = null;

        for (const property of propertyOptions) {
          const roomList = await roomsService.getRooms(property.id);
          const match = (roomList || []).find((item: any) => item.id === id);
          if (match) {
            foundRoom = match;
            break;
          }
        }

        if (!foundRoom) {
          toast({ title: "Room not found", variant: "destructive" });
          navigate("/vendor/rooms");
          return;
        }

        setRoom(foundRoom);
      } catch {
        toast({ title: "Error", description: "Failed to load room", variant: "destructive" });
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate, toast]);

  const initialValues = useMemo<Partial<RoomFormValues> | undefined>(() => {
    if (!room) return undefined;

    return {
      propertyId: room.property?.id || "",
      name: room.name,
      type: room.type,
      description: room.description || "",
      capacity: room.capacity,
      extraBedCapacity: room.extraBedCapacity || 0,
      pricePerNight: String(room.pricePerNight ?? room.basePrice ?? ""),
      weekendPrice: "",
      amenities: room.amenities || [],
      totalRooms: room.totalRooms,
      images: room.images || [],
    };
  }, [room]);

  const handleSubmit = async (values: RoomFormValues) => {
    if (!id) return;

    setSubmitting(true);
    try {
      await roomsService.updateRoom(id, {
        name: values.name,
        type: values.type,
        description: values.description,
        capacity: values.capacity,
        extraBedCapacity: values.extraBedCapacity,
        pricePerNight: parseFloat(values.pricePerNight),
        weekendPrice: values.weekendPrice ? parseFloat(values.weekendPrice) : undefined,
        amenities: values.amenities,
        totalRooms: values.totalRooms,
        images: values.images,
      });

      toast({ title: "Room updated successfully" });
      navigate(`/vendor/rooms/${id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update room", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!room || !initialValues) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">Loading room...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Edit Room</CardTitle>
      </CardHeader>
      <CardContent>
        <RoomForm
          initialValues={initialValues}
          properties={properties}
          submitLabel="Update Room"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/vendor/rooms/${id}`)}
        />
      </CardContent>
    </Card>
  );
};

export default EditRoom;
