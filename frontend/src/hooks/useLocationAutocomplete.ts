import { useEffect, useRef, useState } from "react";

export interface LocationSuggestion {
  label: string; // full display name
  primary: string; // short place name (city/town/…)
  lat: number;
  lng: number;
}

/**
 * Debounced location autocomplete backed by OpenStreetMap Nominatim,
 * restricted to India. Returns place suggestions (with coordinates) for the
 * given query once it is at least 2 characters.
 */
export function useLocationAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    window.clearTimeout(timer.current);
    setLoading(true);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        const mapped: LocationSuggestion[] = (Array.isArray(data) ? data : [])
          .map((d: any) => {
            const a = d.address || {};
            const primary =
              a.city || a.town || a.village || a.suburb || a.state_district ||
              a.county || String(d.display_name || "").split(",")[0];
            return {
              label: d.display_name as string,
              primary,
              lat: parseFloat(d.lat),
              lng: parseFloat(d.lon),
            };
          })
          .filter((s) => !Number.isNaN(s.lat) && !Number.isNaN(s.lng));
        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer.current);
  }, [query]);

  return { suggestions, loading };
}
