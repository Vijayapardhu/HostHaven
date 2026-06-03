import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Edit2, ShieldAlert, Check, CalendarDays } from "lucide-react";
import { propertiesService } from "../../lib/properties";
import { mediaUploadService } from "../../lib/mediaUpload";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

type RoomCardData = {
    id: string;
    name: string;
    type?: string;
    pricePerNight?: number;
    weekendPrice?: number | null;
    availableRooms?: number;
    totalRooms?: number;
    isActive?: boolean;
    images?: string[];
    video?: string | null;
};

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
};

interface RoomManagementCardProps {
    room: RoomCardData;
    onUpdate: () => void;
}

export function RoomManagementCard({ room, onUpdate }: RoomManagementCardProps) {
    const navigate = useNavigate();
    const [isEditingMetrics, setIsEditingMetrics] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const getRoomImageUrls = (images: any): string[] => {
        if (!images || !Array.isArray(images)) return [];
        return images.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean);
    };

    // Form states
    const [basePrice, setBasePrice] = useState(room.pricePerNight?.toString() || "0");
    const [weekendPrice, setWeekendPrice] = useState(room.weekendPrice?.toString() || "");
    const [availableRooms, setAvailableRooms] = useState(room.availableRooms?.toString() || "1");
    const [roomImages, setRoomImages] = useState<string[]>(getRoomImageUrls(room.images));
    const [roomVideo, setRoomVideo] = useState(room.video || "");

    const [blockStart, setBlockStart] = useState("");
    const [blockEnd, setBlockEnd] = useState("");
    const [blockQuantity, setBlockQuantity] = useState("1");

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const uploaded = await mediaUploadService.uploadSingle(file, { folder: 'rooms', resourceType: 'video' });
            const videoUrl = uploaded.url;
            setRoomVideo(videoUrl);
            await propertiesService.updateRoom(room.id, { video: videoUrl });
            toast.success("Room video updated successfully.");
            onUpdate();
        } catch (err) {
            toast.error("Failed to upload video.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveVideo = async () => {
        try {
            await propertiesService.updateRoom(room.id, { video: "" });
            setRoomVideo("");
            toast.success("Video removed.");
            onUpdate();
        } catch (err) {
            toast.error("Failed to remove video.");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setIsUploading(true);
        const fileArray = Array.from(files);
        try {
            const uploaded = await mediaUploadService.uploadMultiple(fileArray, { folder: 'rooms' });
            const newImages = [...roomImages, ...uploaded.map((img) => img.url)];
            setRoomImages(newImages);
            await propertiesService.updateRoom(room.id, { images: newImages });
            toast.success("Room images updated successfully.");
            onUpdate();
        } catch (err) {
            toast.error("Failed to upload images.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = async (index: number) => {
        const newImages = roomImages.filter((_, i) => i !== index);
        setRoomImages(newImages);
        try {
            await propertiesService.updateRoom(room.id, { images: newImages });
            toast.success("Image removed.");
            onUpdate();
        } catch (err) {
            toast.error("Failed to remove image.");
            onUpdate();
        }
    };

    const handleUpdateMetrics = async () => {
        try {
            await propertiesService.updateRoom(room.id, {
                pricePerNight: Number(basePrice),
                weekendPrice: weekendPrice ? Number(weekendPrice) : undefined,
                availableRooms: Number(availableRooms),
            });
            toast.success("Room metrics updated successfully.");
            setIsEditingMetrics(false);
            onUpdate();
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError?.response?.data?.message || apiError?.message || "Failed to update room metrics.");
        }
    };

    const handleBlockDates = async () => {
        if (!blockStart || !blockEnd) {
            toast.error("Please select start and end dates.");
            return;
        }
        try {
            await propertiesService.blockRoomDates(room.id, {
                checkInDate: new Date(blockStart).toISOString(),
                checkOutDate: new Date(blockEnd).toISOString(),
                quantity: Number(blockQuantity),
            });
            toast.success("Room dates permanently blocked for specified duration.");
            setIsBlocking(false);
            onUpdate();
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError?.response?.data?.message || apiError?.message || "Failed to block room dates.");
        }
    };

    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{room.name} <span className="text-slate-400 text-xs font-normal">({room.type})</span></CardTitle>
                        <button
                            type="button"
                            onClick={() => navigate(`/rooms/${room.id}/inventory`)}
                            className="p-1 hover:bg-slate-100 rounded text-indigo-600 transition-colors"
                            title="Advanced Inventory Control"
                        >
                            <CalendarDays className="h-4 w-4" />
                        </button>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${room.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {room.isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    
                    {/* Images Section */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-800">Room Images</h4>
                            <label className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors">
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                {isUploading ? "Uploading..." : "+ Add Images"}
                            </label>
                        </div>
                        {roomImages.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {roomImages.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <img src={img} alt={`Room ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                            {idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                                <p className="text-sm text-slate-500">No images uploaded yet.</p>
                                <p className="text-xs text-slate-400 mt-1">Click "+ Add Images" to upload room photos.</p>
                            </div>
                        )}
                    </div>

                    {/* Video Section */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-800">Room Video</h4>
                            <label className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md cursor-pointer transition-colors">
                                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isUploading} />
                                {isUploading ? "Uploading..." : "+ Add Video"}
                            </label>
                        </div>
                        {roomVideo ? (
                            <div className="relative rounded-lg overflow-hidden">
                                <video src={roomVideo} className="w-full h-40 object-cover" controls />
                                <button
                                    type="button"
                                    onClick={handleRemoveVideo}
                                    className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium"
                                >
                                    Remove Video
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">No video uploaded yet. Click "Add Video" to upload.</p>
                        )}
                    </div>

                    {/* Metrics Section */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-800">Inventory & Pricing</h4>
                            {!isEditingMetrics ? (
                                <button type="button" onClick={() => setIsEditingMetrics(true)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                                    <Edit2 className="h-3 w-3" /> Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setIsEditingMetrics(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                                    <button type="button" onClick={handleUpdateMetrics} className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
                                        <Check className="h-3 w-3" /> Save
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Base Price / Night</label>
                                {isEditingMetrics ? (
                                    <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full text-sm rounded border-slate-300 p-1" />
                                ) : (
                                    <div className="text-sm font-semibold text-slate-900">₹{room.pricePerNight}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Weekend Price</label>
                                {isEditingMetrics ? (
                                    <input type="number" value={weekendPrice} onChange={(e) => setWeekendPrice(e.target.value)} className="w-full text-sm rounded border-slate-300 p-1" placeholder="Optional" />
                                ) : (
                                    <div className="text-sm font-semibold text-slate-900">{room.weekendPrice ? `₹${room.weekendPrice}` : "—"}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Available Rooms</label>
                                {isEditingMetrics ? (
                                    <input type="number" value={availableRooms} onChange={(e) => setAvailableRooms(e.target.value)} className="w-full text-sm rounded border-slate-300 p-1" />
                                ) : (
                                    <div className="text-sm font-semibold text-slate-900">{room.availableRooms} / {room.totalRooms}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Block Dates Section */}
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-red-800 flex items-center gap-1">
                                <ShieldAlert className="h-4 w-4" /> Admin Exclusivity Block
                            </h4>
                            {!isBlocking ? (
                                <button type="button" onClick={() => setIsBlocking(true)} className="flex items-center gap-1 text-xs text-red-600 font-semibold hover:text-red-700 bg-red-100 rounded px-2 py-1">
                                    Override & Block
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setIsBlocking(false)} className="text-xs text-red-500 hover:text-red-700">Cancel</button>
                                    <button type="button" onClick={handleBlockDates} className="flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                                        <Check className="h-3 w-3" /> Apply Block
                                    </button>
                                </div>
                            )}
                        </div>

                        {isBlocking ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-red-700 block mb-1">Start Date</label>
                                    <input type="date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="w-full text-sm rounded border-red-200 p-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-red-700 block mb-1">End Date</label>
                                    <input type="date" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="w-full text-sm rounded border-red-200 p-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-red-700 block mb-1">Quantity</label>
                                    <input type="number" min="1" max={room.totalRooms} value={blockQuantity} onChange={(e) => setBlockQuantity(e.target.value)} className="w-full text-sm rounded border-red-200 p-1" />
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-red-600">
                                Permanently lock dates and restrict inventory from vendors and public bookings.
                            </p>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
