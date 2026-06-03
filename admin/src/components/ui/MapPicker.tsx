import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
    latitude?: number;
    longitude?: number;
    onChange: (lat: number | undefined, lng: number | undefined) => void;
}

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
}

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );

    const DEFAULT_CENTER: L.LatLngTuple = [15.9129, 79.74];
    const DEFAULT_ZOOM = 7;

    useEffect(() => {
        if (latitude && longitude) {
            setSelectedCoords({ lat: latitude, lng: longitude });
        }
    }, [latitude, longitude]);

    useEffect(() => {
        if (!isMapVisible || !mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            center: selectedCoords ? [selectedCoords.lat, selectedCoords.lng] : DEFAULT_CENTER,
            zoom: selectedCoords ? 15 : DEFAULT_ZOOM,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        if (selectedCoords) {
            placeMarker(map, selectedCoords.lat, selectedCoords.lng);
        }

        map.on("click", async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            placeMarker(map, lat, lng);
            setSelectedCoords({ lat, lng });
            onChange(lat, lng);

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                if (data.display_name) {
                    setSearchQuery(data.display_name);
                }
            } catch {
                // Silent fail
            }
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMapVisible]);

    const placeMarker = (map: L.Map, lat: number, lng: number) => {
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
            markerRef.current.on("dragend", () => {
                if (markerRef.current) {
                    const pos = markerRef.current.getLatLng();
                    setSelectedCoords({ lat: pos.lat, lng: pos.lng });
                    onChange(pos.lat, pos.lng);
                }
            });
        }
        map.setView([lat, lng], 15, { animate: true });
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=in`,
                { headers: { "Accept-Language": "en" } }
            );
            const data: NominatimResult[] = await res.json();
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectResult = (result: NominatimResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSelectedCoords({ lat, lng });
        onChange(lat, lng);
        setSearchResults([]);
        setSearchQuery(result.display_name);
        if (mapInstanceRef.current) {
            placeMarker(mapInstanceRef.current, lat, lng);
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            if (mapInstanceRef.current) placeMarker(mapInstanceRef.current, lat, lng);
            setSelectedCoords({ lat, lng });
            onChange(lat, lng);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                if (data.display_name) {
                    setSearchQuery(data.display_name);
                }
            } catch {
                // Silent fail
            }
        }, (err) => {
            console.error("Geolocation error:", err);
        });
    };

    const clearLocation = () => {
        setSelectedCoords(null);
        setSearchQuery("");
        onChange(undefined, undefined);
        if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsMapVisible((v) => !v)}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        isMapVisible
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                    {isMapVisible ? "Close Map" : "📍 Pick on Map"}
                </button>
                {selectedCoords && (
                    <button
                        type="button"
                        onClick={clearLocation}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {selectedCoords && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                    <MapPin className="w-3 h-3" />
                    <span>
                        {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                    </span>
                </div>
            )}

            {isMapVisible && (
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg">
                    <div className="p-2 bg-white border-b border-slate-200 flex gap-2 relative">
                        <input
                            type="text"
                            placeholder="Search a location in India..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isSearching ? "..." : <Search className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={handleUseMyLocation}
                            title="Use my current location"
                            className="px-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
                        >
                            <Navigation className="w-4 h-4" />
                        </button>

                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-2 right-2 z-50 bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {searchResults.map((r, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => selectResult(r)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                    >
                                        {r.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div ref={mapRef} className="w-full h-64" />
                </div>
            )}
        </div>
    );
}
