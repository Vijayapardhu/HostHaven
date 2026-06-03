import { useState, useEffect, useCallback } from "react";
import { Search, X, Check, Loader2, Building2, Landmark, Briefcase } from "lucide-react";
import { propertiesService } from "../../lib/properties";
import { templesService } from "../../lib/temples";
import { servicesService } from "../../lib/services";

type ItemType = "property" | "temple" | "service";

interface PickerItem {
    id: string;
    name: string;
    subtitle: string;
    imageUrl: string;
    link: string;
}

interface DatabaseItemPickerProps {
    type: ItemType;
    onSelect: (item: PickerItem) => void;
    onClose: () => void;
}

export function DatabaseItemPicker({ type, onSelect, onClose }: DatabaseItemPickerProps) {
    const [items, setItems] = useState<PickerItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const isValidImageUrl = (url: string): boolean => {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim();
        if (!trimmed) return false;
        // Check for obviously invalid URLs
        if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') return false;
        return true;
    };

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            if (type === "property") {
                const res = await propertiesService.getProperties({ search, limit: 100 });
                setItems(res.data.map(p => ({
                    id: p.id,
                    name: p.name,
                    subtitle: `${p.type.toUpperCase()} • ${p.city}`,
                    imageUrl: p.images?.[0] && isValidImageUrl(typeof p.images[0] === 'string' ? p.images[0] : (p.images[0] as any)?.url) 
                        ? (typeof p.images[0] === 'string' ? p.images[0] : (p.images[0] as any).url) 
                        : "",
                    link: `/${p.type === 'home' ? 'homes' : 'hotels'}/${p.slug}`
                })));
            } else if (type === "temple") {
                const res = await templesService.getTemples({ search, limit: 100 });
                setItems(res.data.map(t => ({
                    id: t.id,
                    name: t.name,
                    subtitle: t.city,
                    imageUrl: t.images?.[0]?.url && isValidImageUrl(t.images[0].url) ? t.images[0].url : "",
                    link: `/temples/${t.slug}`
                })));
            } else if (type === "service") {
                const res = await servicesService.getServices({ search, limit: 100 });
                // Handle different possible response structures for services
                const serviceData = res.data ?? [];
                setItems(serviceData.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    subtitle: s.category,
                    imageUrl: s.images?.[0] && isValidImageUrl(s.images[0]) ? s.images[0] : "",
                    link: `/services#${s.id}`
                })));
            }
        } catch (error) {
            console.error("Failed to fetch items for picker", error);
        } finally {
            setIsLoading(false);
        }
    }, [type, search]);

    useEffect(() => {
        const timer = setTimeout(fetchItems, 300);
        return () => clearTimeout(timer);
    }, [fetchItems]);

    const getIcon = () => {
        switch (type) {
            case "property": return <Building2 className="h-5 w-5 text-indigo-500" />;
            case "temple": return <Landmark className="h-5 w-5 text-amber-500" />;
            case "service": return <Briefcase className="h-5 w-5 text-emerald-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                        {getIcon()}
                        <span>Select {type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 bg-slate-50 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder={`Search ${type}s...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading && items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Searching database...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>No {type}s found matching your search.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group text-left"
                            >
                                <div className="h-12 w-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                    {item.imageUrl && !imageErrors[item.id] ? (
                                        <img 
                                            src={item.imageUrl} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover"
                                            onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            {getIcon()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-indigo-50 text-indigo-600 rounded-full p-1.5">
                                        <Check className="h-4 w-4" />
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
