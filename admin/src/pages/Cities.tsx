import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Search, ToggleLeft, ToggleRight, MapPin } from "lucide-react";
import { propertiesService } from "../lib/properties";
import { PageHeader } from "../components/ui/PageHeader";
import { ImportExportButtons } from "../components/ui/ImportExportButtons";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import * as Dialog from "@radix-ui/react-dialog";

interface City {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const data = await propertiesService.getAllCities();
      setCities(data || []);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleToggle = async (city: City) => {
    try {
      await propertiesService.toggleCity(city.name, !city.isActive);
      toast.success(`City ${city.isActive ? "deactivated" : "activated"}`);
      fetchCities();
    } catch (error: any) {
      toast.error(error?.message || "Failed to toggle city");
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;
    setIsSaving(true);
    try {
      await propertiesService.createCity(newCityName.trim());
      toast.success("City added successfully");
      setNewCityName("");
      setIsAddingNew(false);
      fetchCities();
    } catch (error: any) {
      toast.error(error?.message || "Failed to add city");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = cities.filter((c) => c.isActive).length;
  const inactiveCount = cities.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cities Management"
        description="Manage platform cities available for properties"
        actions={
          <ImportExportButtons 
            entity="platformCities" 
            onImportComplete={() => fetchCities()}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.length}</div>
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
          <CardTitle>All Cities</CardTitle>
          <Dialog.Root open={isAddingNew} onOpenChange={setIsAddingNew}>
            <Dialog.Trigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add City
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg">
                <Dialog.Title className="text-lg font-semibold">Add New City</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mb-4">
                  Enter a city name to add it to the platform.
                </Dialog.Description>
                <Input
                  placeholder="e.g., Vijayawada, Guntur, Tirupati"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCity();
                  }}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCity} disabled={!newCityName.trim() || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add City
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
                placeholder="Search cities..."
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
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No cities found matching your search" : "No cities yet. Add your first city!"}
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{city.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(city.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(city)}
                    className={city.isActive ? "text-green-600" : "text-muted-foreground"}
                  >
                    {city.isActive ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
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
