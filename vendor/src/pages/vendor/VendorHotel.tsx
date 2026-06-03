import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Save, Image as ImageIcon, Video } from "lucide-react";
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";

const amenitiesList = [
    "wifi", "parking", "pool", "gym", "restaurant", "room-service", "ac", "tv",
    "laundry", "kitchen", "garden", "balcony", "mini-bar", "coffee-maker",
    "spa", "bar", "business-center", "airport-shuttle"
];

const VendorHotel = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data: hotel, isLoading, error } = useQuery({
        queryKey: ["vendorHotel"],
        queryFn: () => vendorService.getHotel(),
    });

    useEffect(() => {
        if (hotel) {
            setFormData({
                name: hotel.name || "",
                description: hotel.description || "",
                shortDesc: hotel.shortDesc || "",
                amenities: hotel.amenities || [],
                highlights: hotel.highlights || [],
                policies: hotel.policies || [],
            });
        }
    }, [hotel]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => vendorService.updateHotel(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendorHotel"] });
            toast({ title: "Success", description: "Hotel details updated successfully." });
        },
        onError: (err: any) => {
            toast({
                title: "Update Failed",
                description: err.message || "Could not update hotel details.",
                variant: "destructive",
            });
        },
    });

    const uploadMediaMutation = useMutation({
        mutationFn: (file: File) => vendorService.uploadHotelImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendorHotel"] });
            toast({ title: "Success", description: "Media uploaded successfully." });
        },
        onError: (err: any) => {
            toast({
                title: "Upload Failed",
                description: err.message || "Could not upload media.",
                variant: "destructive",
            });
        },
    });

    const deleteMediaMutation = useMutation({
        mutationFn: (imgId: string) => vendorService.deleteHotelImage(imgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendorHotel"] });
            toast({ title: "Success", description: "Media deleted successfully." });
        },
        onError: (err: any) => {
            toast({
                title: "Delete Failed",
                description: err.message || "Could not delete media.",
                variant: "destructive",
            });
        },
    });

    if (isLoading) return <LoadingState message="Loading hotel details..." />;
    if (error) return <ErrorState title="Failed to load hotel" description="An error occurred while fetching your hotel details." />;
    if (!hotel || !formData) return <ErrorState title="Hotel Not Found" description="We couldn't find a hotel associated with your account." />;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: string) => {
        const valueStr = e.target.value;
        const items = valueStr.split(",").map(val => val.trim()).filter(Boolean);
        setFormData((prev: any) => ({ ...prev, [fieldName]: items }));
    };

    const handleAmenityToggle = (amenity: string) => {
        setFormData((prev: any) => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter((a: string) => a !== amenity)
                : [...prev.amenities, amenity],
        }));
    };

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        for (let i = 0; i < files.length; i++) {
            await uploadMediaMutation.mutateAsync(files[i]);
        }
        setIsUploading(false);
    };

    const handleDeleteMedia = (imgId: string) => {
        if (confirm("Are you sure you want to delete this media?")) {
            deleteMediaMutation.mutate(imgId);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">My Hotel</h1>
                    <p className="text-muted-foreground mt-1">Manage your hotel's details, amenities, and media.</p>
                </div>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-6 bg-card border shadow-sm">
                    <TabsTrigger value="general">General Info</TabsTrigger>
                    <TabsTrigger value="details">Highlights & Policies</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="media">Images & Video</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Update your hotel's main details visible to guests.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Hotel Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="E.g., Grand Plaza Hotel"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shortDesc">Short Tagline</Label>
                                <Input
                                    id="shortDesc"
                                    name="shortDesc"
                                    value={formData.shortDesc}
                                    onChange={handleChange}
                                    placeholder="E.g., Luxury stay in the heart of the city"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Full Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Provide a detailed description of your hotel..."
                                    rows={6}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Highlights & Policies</CardTitle>
                            <CardDescription>List your property's best features and basic rules.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="highlights">Hotel Highlights (Comma separated)</Label>
                                <Textarea
                                    id="highlights"
                                    name="highlights"
                                    value={formData.highlights?.join(", ") || ""}
                                    onChange={(e) => handleArrayChange(e, "highlights")}
                                    placeholder="E.g., Near City Center, Free Breakfast, Ocean View"
                                    rows={3}
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.highlights?.map((hl: string, index: number) => (
                                        <Badge key={index} variant="secondary">{hl}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="policies">Hotel Policies (Comma separated)</Label>
                                <Textarea
                                    id="policies"
                                    name="policies"
                                    value={formData.policies?.join(", ") || ""}
                                    onChange={(e) => handleArrayChange(e, "policies")}
                                    placeholder="E.g., No smoking, Pets allowed on request, Check-in at 2 PM"
                                    rows={3}
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.policies?.map((pol: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-amber-700 bg-amber-50">{pol}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="amenities">
                    <Card>
                        <CardHeader>
                            <CardTitle>Amenities</CardTitle>
                            <CardDescription>Select the facilities available at your hotel.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {amenitiesList.map((amenity) => (
                                    <label
                                        key={amenity}
                                        className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted transition-colors"
                                    >
                                        <Checkbox
                                            checked={formData.amenities.includes(amenity)}
                                            onCheckedChange={() => handleAmenityToggle(amenity)}
                                        />
                                        <span className="text-sm font-medium capitalize">{amenity.replace("-", " ")}</span>
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="media">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Media Gallery</CardTitle>
                                <CardDescription>Upload high-quality images and promotional videos.</CardDescription>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleMediaUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isUploading}
                                />
                                <Button variant="secondary" disabled={isUploading} className="gap-2">
                                    <Upload className="w-4 h-4" />
                                    {isUploading ? "Uploading..." : "Upload Media"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {hotel.images?.map((img: any, index: number) => {
                                    const imageUrl = typeof img === 'string' ? img : img?.url;
                                    if (!imageUrl) return null;
                                    return (
                                    <div key={index} className="relative group rounded-xl overflow-hidden border bg-muted aspect-video">
                                        <img
                                            src={imageUrl}
                                            alt={img?.alt || `Hotel Image ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="rounded-full h-8 w-8"
                                                onClick={() => handleDeleteMedia(img.id || img.url)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {img.isPrimary && (
                                            <Badge className="absolute top-2 left-2 bg-primary">Primary</Badge>
                                        )}
                                    </div>
                                    );
                                })}

                                {hotel.videos?.map((vid: any, index: number) => (
                                    <div key={`vid-${index}`} className="relative group rounded-xl overflow-hidden border bg-muted aspect-video">
                                        <video
                                            src={vid.url}
                                            className="w-full h-full object-cover"
                                            controls={false}
                                        />
                                        <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white backdrop-blur-sm">
                                            <Video className="w-4 h-4" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="rounded-full h-8 w-8"
                                                onClick={() => handleDeleteMedia(vid.id || vid.url)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {(!hotel.images?.length && !hotel.videos?.length) && (
                                    <div className="col-span-full py-12 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground">
                                        <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No media added to this hotel yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default VendorHotel;
