import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { propertiesService } from "../lib/properties";
import { PageHeader } from "../components/ui/PageHeader";
import { ImportExportButtons } from "../components/ui/ImportExportButtons";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import * as Dialog from "@radix-ui/react-dialog";

interface Amenity {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchAmenities = async () => {
    setIsLoading(true);
    try {
      const data = await propertiesService.getAllAmenities();
      setAmenities(data || []);
    } catch (error) {
      console.error("Failed to fetch amenities:", error);
      toast.error("Failed to load amenities");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const handleToggle = async (amenity: Amenity) => {
    try {
      await propertiesService.toggleAmenity(amenity.name, !amenity.isActive);
      toast.success(`Amenity ${amenity.isActive ? "deactivated" : "activated"}`);
      fetchAmenities();
    } catch (error: any) {
      toast.error(error?.message || "Failed to toggle amenity");
    }
  };

  const handleAddAmenity = async () => {
    if (!newAmenityName.trim()) return;
    setIsSaving(true);
    try {
      const normalizedName = newAmenityName.trim().toLowerCase().replace(/\s+/g, "-");
      await propertiesService.toggleAmenity(normalizedName, true);
      toast.success("Amenity added successfully");
      setNewAmenityName("");
      setIsAddingNew(false);
      fetchAmenities();
    } catch (error: any) {
      toast.error(error?.message || "Failed to add amenity");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAmenities = amenities.filter((amenity) =>
    amenity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = amenities.filter((a) => a.isActive).length;
  const inactiveCount = amenities.filter((a) => !a.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenities Management"
        description="Manage platform amenities available for properties and rooms"
        actions={
          <ImportExportButtons 
            entity="platformAmenities" 
            onImportComplete={() => fetchAmenities()}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{amenities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Amenities</CardTitle>
          <Dialog.Root open={isAddingNew} onOpenChange={setIsAddingNew}>
            <Dialog.Trigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Amenity
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold">Add New Amenity</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mb-4">
                  Enter a name for the new amenity. It will be activated automatically.
                </Dialog.Description>
                <Input
                  placeholder="e.g., Hot Tub, Mountain View, Room Service"
                  value={newAmenityName}
                  onChange={(e) => setNewAmenityName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddAmenity();
                  }}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAmenity} disabled={!newAmenityName.trim() || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Amenity
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search amenities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAmenities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No amenities found matching your search" : "No amenities yet. Add your first amenity!"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium capitalize">{amenity.name.replace(/-/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(amenity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(amenity)}
                    className={amenity.isActive ? "text-green-600" : "text-muted-foreground"}
                  >
                    {amenity.isActive ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                    <span className="ml-2">{amenity.isActive ? "Active" : "Inactive"}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
