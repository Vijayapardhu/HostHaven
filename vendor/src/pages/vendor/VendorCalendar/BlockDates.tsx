import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vendorService } from "@/lib/vendor";
import { inventoryService } from "@/lib/inventory";
import { useToast } from "@/hooks/use-toast";

interface PropertyOption {
  id: string;
  name: string;
}

const BlockDates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await vendorService.getProperties();
        const mapped = (response.data || response || []).map((property: any) => ({
          id: property.id,
          name: property.name,
        }));
        setProperties(mapped);
        if (mapped.length > 0) {
          setSelectedPropertyId(mapped[0].id);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load properties", variant: "destructive" });
      }
    };

    fetchProperties();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedPropertyId || !startDate || !endDate) {
      toast({ title: "Missing required fields", description: "Property and date range are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      await inventoryService.blockDates({
        propertyId: selectedPropertyId,
        startDate,
        endDate,
        reason: reason || undefined,
      });

      toast({ title: "Dates blocked", description: "Availability was updated successfully" });
      navigate("/calendar");
    } catch (error: any) {
      toast({
        title: "Failed to block dates",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Block Dates</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea id="reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Maintenance, private event, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/calendar")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Blocking..." : "Block Dates"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BlockDates;
