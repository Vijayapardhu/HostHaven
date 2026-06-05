import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
}

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
}

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const DEFAULT_CENTER: L.LatLngTuple = [15.9129, 79.74];
    const DEFAULT_ZOOM = 7;

    useEffect(() => {
        setSelectedAddress(value);
    }, [value]);

    useEffect(() => {
        if (!isMapVisible || !mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        map.on("click", async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            placeMarker(map, lat, lng);

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                setSelectedAddress(address);
                onChange(address, lat, lng);
            } catch {
                const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                setSelectedAddress(fallback);
                onChange(fallback, lat, lng);
            }
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [isMapVisible]);

    const placeMarker = (map: L.Map, lat: number, lng: number) => {
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        map.setView([lat, lng], 15, { animate: true });
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        setHighlightedIndex(-1);
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
        setSelectedAddress(result.display_name);
        onChange(result.display_name, lat, lng);
        setSearchResults([]);
        setSearchQuery("");
        setHighlightedIndex(-1);
        if (mapInstanceRef.current) {
            placeMarker(mapInstanceRef.current, lat, lng);
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            if (mapInstanceRef.current) placeMarker(mapInstanceRef.current, lat, lng);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                setSelectedAddress(address);
                onChange(address, lat, lng);
            } catch {
                const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                setSelectedAddress(fallback);
                onChange(fallback, lat, lng);
            }
        });
    };

    const toggleMapVisibility = () => {
        setIsMapVisible((v) => !v);
    };

    const handleReadonlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMapVisibility();
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < searchResults.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : searchResults.length - 1
            );
        } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
            e.preventDefault();
            selectResult(searchResults[highlightedIndex]);
        } else if (e.key === "Enter") {
            handleSearch();
        } else if (e.key === "Escape") {
            setSearchResults([]);
            setHighlightedIndex(-1);
        }
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <input
                    type="text"
                    readOnly
                    role="button"
                    tabIndex={0}
                    aria-label="Open location search"
                    aria-expanded={isMapVisible}
                    placeholder="Click 'Pick on Map' to select a location"
                    value={selectedAddress}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm cursor-pointer"
                    onClick={toggleMapVisibility}
                    onKeyDown={handleReadonlyKeyDown}
                />
                <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-primary pointer-events-none" />
            </div>

            <button
                type="button"
                onClick={toggleMapVisibility}
                aria-label={isMapVisible ? "Close map" : "Pick on map"}
                className="text-xs text-primary underline font-medium"
            >
                {isMapVisible ? "Close Map" : "📍 Pick on Map"}
            </button>

            {isMapVisible && (
                <div className="rounded-xl overflow-hidden border border-border shadow-lg space-y-0">
                    <div className="p-2 bg-background border-b border-border flex gap-2 relative">
                        <input
                            type="text"
                            aria-label="Search for a location"
                            aria-activedescendant={
                                highlightedIndex >= 0 ? `location-option-${highlightedIndex}` : undefined
                            }
                            placeholder="Search a location in India..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                        >
                            {isSearching ? "..." : <Search className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={handleUseMyLocation}
                            aria-label="Use my current location"
                            className="px-3 py-1.5 rounded-md border border-border text-xs text-foreground"
                        >
                            📍 Me
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMapVisible(false)}
                            aria-label="Close map panel"
                            className="px-2 text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {searchResults.length > 0 && (
                            <div
                                role="listbox"
                                aria-label="Location suggestions"
                                className="absolute top-full left-2 right-2 z-50 bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
                            >
                                {searchResults.map((r, i) => (
                                    <button
                                        key={i}
                                        id={`location-option-${i}`}
                                        role="option"
                                        aria-selected={i === highlightedIndex}
                                        type="button"
                                        onClick={() => selectResult(r)}
                                        className={`w-full text-left px-3 py-2 text-xs border-b border-border last:border-0 ${i === highlightedIndex ? "bg-accent" : "hover:bg-accent"}`}
                                    >
                                        {r.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div ref={mapRef} className="w-full h-60" />

                    {selectedAddress && (
                        <div className="px-3 py-2 bg-primary/5 border-t border-border text-xs text-foreground flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            <span className="line-clamp-2">{selectedAddress}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
