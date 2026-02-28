import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Edit2, ShieldAlert, Check, CalendarDays } from "lucide-react";
import { propertiesService } from "../../lib/properties";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface RoomManagementCardProps {
    room: any;
    onUpdate: () => void;
}

export function RoomManagementCard({ room, onUpdate }: RoomManagementCardProps) {
    const navigate = useNavigate();
    const [isEditingMetrics, setIsEditingMetrics] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

    // Form states
    const [basePrice, setBasePrice] = useState(room.pricePerNight?.toString() || "0");
    const [weekendPrice, setWeekendPrice] = useState(room.weekendPrice?.toString() || "");
    const [availableRooms, setAvailableRooms] = useState(room.availableRooms?.toString() || "1");

    const [blockStart, setBlockStart] = useState("");
    const [blockEnd, setBlockEnd] = useState("");
    const [blockQuantity, setBlockQuantity] = useState("1");

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
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update room metrics.");
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
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to block room dates.");
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
