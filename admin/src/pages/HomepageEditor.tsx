import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Type,
  Link2,
  MapPin,
} from "lucide-react";
import { ImageUpload, type UploadedImage } from "../components/ui/ImageUpload";
import {
  settingsService,
  type HomepageConfig,
  type BannerSlide,
  type FeatureCardItem,
  type ServiceCardItem,
  type TempleItem,
} from "../lib/settings";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/PageLoader";
import { EmptyState } from "../components/ui/EmptyState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";

const defaultConfig: HomepageConfig = {
  sections: {
    banner: { isVisible: true, order: 0 },
    hero: { isVisible: true, order: 1 },
    promoBanner: { isVisible: true, order: 2 },
    features: { isVisible: true, order: 3 },
    destinations: { isVisible: true, order: 4 },
    recommendations: { isVisible: true, order: 5 },
    temples: { isVisible: true, order: 6 },
    services: { isVisible: true, order: 7 },
    becomePartner: { isVisible: true, order: 8 },
  },
  bannerSlides: [],
  destinations: [],
  featureCards: [],
  serviceCards: [],
  temples: [],
  partnerSection: {
    title: "Are you a property owner?",
    subtitle: "List your property on HostHaven and start earning today",
    ctaText: "Become a Partner",
    ctaLink: "/vendor/signup",
  },
  promoBanner: {
    isVisible: true,
    imageUrl: "",
    link: "/",
    title: "",
  },
};

const SECTION_LABELS: Record<string, string> = {
  banner: "Banner Carousel",
  hero: "Search Hero",
  promoBanner: "Promo Banner",
  features: "Feature Cards",
  destinations: "Top Destinations",
  recommendations: "Recommendations",
  temples: "Temples Preview",
  services: "Travel Services",
  becomePartner: "Become a Partner CTA",
};

const iconOptions = [
  "clock",
  "settings",
  "refresh",
  "shield",
  "zap",
  "star",
  "heart",
  "car",
  "bike",
  "wrench",
  "map",
  "home",
  "building",
  "phone",
  "mail",
];

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function HomepageEditor() {
  const [config, setConfig] = useState<HomepageConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("sections");

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await settingsService.getHomepageConfig();
      if (data && typeof data === "object") {
        setConfig({ ...defaultConfig, ...data });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load homepage config.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateHomepageConfig(config);
      toast.success("Homepage configuration saved successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save homepage config.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: { ...prev.sections[key], isVisible: !prev.sections[key]?.isVisible },
      },
    }));
  };

  const tabs = [
    { id: "sections", label: "Sections" },
    { id: "banners", label: "Banners" },
    { id: "promo", label: "Promo Banner" },
    { id: "destinations", label: "Destinations" },
    { id: "features", label: "Features" },
    { id: "temples", label: "Temples" },
    { id: "services", label: "Services" },
    { id: "partner", label: "Partner CTA" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Homepage Editor" description="Customize the frontend homepage." />
        <PageLoader rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Homepage Editor" description="Customize the frontend homepage." />
        <EmptyState
          title="Unable to load config"
          description={error}
          action={
            <button type="button" onClick={fetchConfig} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Editor"
        description="Customize the frontend homepage sections, banners, destinations, and more."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-500" />
              Section Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500">
              Toggle sections on or off. Hidden sections won't appear on the homepage.
            </p>
            <div className="space-y-3">
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-slate-300" />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSection(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.sections[key]?.isVisible ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.sections[key]?.isVisible ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Image className="h-4 w-4 text-slate-500" />
                Banner Slides
              </span>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    bannerSlides: [
                      ...prev.bannerSlides,
                      { id: generateId(), title: "", subtitle: "", tags: "", ctaText: "Learn More", ctaLink: "/hotels", imageUrl: "", isActive: true },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add Slide
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config.bannerSlides.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No banner slides configured. Add one to get started.</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {config.bannerSlides.map((slide, idx) => (
                  <div key={slide.id} className="rounded-lg border border-slate-200 p-4 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Slide {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              bannerSlides: prev.bannerSlides.map((s) =>
                                s.id === slide.id ? { ...s, isActive: !s.isActive } : s
                              ),
                            }))
                          }
                          className="text-slate-400 hover:text-slate-600"
                          title={slide.isActive ? "Hide" : "Show"}
                        >
                          {slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              bannerSlides: prev.bannerSlides.filter((s) => s.id !== slide.id),
                            }))
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Title" value={slide.title} onChange={(v) => updateBannerField(idx, "title", v)} />
                      <InputField label="Subtitle" value={slide.subtitle} onChange={(v) => updateBannerField(idx, "subtitle", v)} />
                      <InputField label="Tags" value={slide.tags} onChange={(v) => updateBannerField(idx, "tags", v)} />
                      <div className="col-span-2">
                        <ImageUpload
                          label="Banner Image"
                          maxImages={1}
                          images={slide.imageUrl ? [{ url: slide.imageUrl, alt: slide.title }] : []}
                          onChange={(imgs: UploadedImage[]) => updateBannerField(idx, "imageUrl", imgs[0]?.url || "")}
                        />
                      </div>
                      <InputField label="CTA Text" value={slide.ctaText} onChange={(v) => updateBannerField(idx, "ctaText", v)} />
                      <InputField label="CTA Link" value={slide.ctaLink} onChange={(v) => updateBannerField(idx, "ctaLink", v)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Destinations Tab */}
      {activeTab === "promo" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-4 w-4 text-slate-500" />
              Promo Banner (Below Hero)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Enable Promo Banner</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        promoBanner: { ...prev.sections.promoBanner, isVisible: !prev.sections.promoBanner?.isVisible },
                      },
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.sections.promoBanner?.isVisible ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.sections.promoBanner?.isVisible ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <InputField
                  label="Banner Title"
                  value={config.promoBanner?.title || ""}
                  onChange={(v) => setConfig((prev) => ({ ...prev, promoBanner: { ...prev.promoBanner!, title: v } }))}
                />
                <div>
                  <ImageUpload
                    label="Promo Banner Image"
                    maxImages={1}
                    images={config.promoBanner?.imageUrl ? [{ url: config.promoBanner.imageUrl, alt: config.promoBanner.title }] : []}
                    onChange={(imgs: UploadedImage[]) => setConfig((prev) => ({ ...prev, promoBanner: { ...prev.promoBanner!, imageUrl: imgs[0]?.url || "" } }))}
                  />
                </div>
                <InputField
                  label="Link (when clicked)"
                  value={config.promoBanner?.link || ""}
                  onChange={(v) => setConfig((prev) => ({ ...prev, promoBanner: { ...prev.promoBanner!, link: v } }))}
                />
              </div>
              {config.promoBanner?.imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Preview</p>
                  <img
                    src={config.promoBanner.imageUrl}
                    alt="Promo preview"
                    className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destinations Tab */}
      {activeTab === "destinations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                Destinations
              </span>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    destinations: [
                      ...prev.destinations,
                      { id: generateId(), name: "", imageUrl: "", link: "/hotels?destination=", isActive: true },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add Destination
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemList
              items={config.destinations}
              onUpdate={(items) => setConfig((prev) => ({ ...prev, destinations: items }))}
              renderFields={(item, idx) => (
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Name" value={item.name} onChange={(v) => updateListField("destinations", idx, "name", v)} />
                  <InputField label="Link" value={item.link} onChange={(v) => updateListField("destinations", idx, "link", v)} />
                  <div className="col-span-2">
                    <ImageUpload
                      label="Destination Image"
                      maxImages={1}
                      images={item.imageUrl ? [{ url: item.imageUrl, alt: item.name }] : []}
                      onChange={(imgs: UploadedImage[]) => updateListField("destinations", idx, "imageUrl", imgs[0]?.url || "")}
                    />
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Features Tab */}
      {activeTab === "features" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Type className="h-4 w-4 text-slate-500" />
                Feature Cards
              </span>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    featureCards: [
                      ...prev.featureCards,
                      { id: generateId(), icon: "star", title: "", description: "", badge: "", link: "", isActive: true },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add Card
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemList
              items={config.featureCards}
              onUpdate={(items) => setConfig((prev) => ({ ...prev, featureCards: items }))}
              renderFields={(item, idx) => (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
                    <select
                      value={(item as FeatureCardItem).icon}
                      onChange={(e) => updateListField("featureCards", idx, "icon", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Title" value={(item as FeatureCardItem).title || ""} onChange={(v) => updateListField("featureCards", idx, "title", v)} />
                  <InputField label="Description" value={(item as FeatureCardItem).description} onChange={(v) => updateListField("featureCards", idx, "description", v)} />
                  <InputField label="Badge Text" value={(item as FeatureCardItem).badge || ""} onChange={(v) => updateListField("featureCards", idx, "badge", v)} />
                  <InputField label="Link (optional)" value={(item as FeatureCardItem).link || ""} onChange={(v) => updateListField("featureCards", idx, "link", v)} />
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Temples Tab */}
      {activeTab === "temples" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                Temples Preview
              </span>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    temples: [
                      ...prev.temples,
                      { id: generateId(), name: "", location: "", imageUrl: "", link: "/temples/", isActive: true },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add Temple
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemList
              items={config.temples}
              onUpdate={(items) => setConfig((prev) => ({ ...prev, temples: items }))}
              renderFields={(item, idx) => (
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Name" value={(item as TempleItem).name} onChange={(v) => updateListField("temples", idx, "name", v)} />
                  <InputField label="Location" value={(item as TempleItem).location} onChange={(v) => updateListField("temples", idx, "location", v)} />
                  <InputField label="Link" value={(item as TempleItem).link} onChange={(v) => updateListField("temples", idx, "link", v)} />
                  <div className="col-span-2">
                    <ImageUpload
                      label="Temple Image"
                      maxImages={1}
                      images={item.imageUrl || (item as TempleItem).imageUrl ? [{ url: item.imageUrl || (item as TempleItem).imageUrl, alt: (item as TempleItem).name }] : []}
                      onChange={(imgs: UploadedImage[]) => updateListField("temples", idx, "imageUrl", imgs[0]?.url || "")}
                    />
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-slate-500" />
                Service Cards
              </span>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    serviceCards: [
                      ...prev.serviceCards,
                      { id: generateId(), icon: "car", title: "", description: "", link: "/services#", isActive: true },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add Service
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ItemList
              items={config.serviceCards}
              onUpdate={(items) => setConfig((prev) => ({ ...prev, serviceCards: items }))}
              renderFields={(item, idx) => (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
                    <select
                      value={(item as ServiceCardItem).icon}
                      onChange={(e) => updateListField("serviceCards", idx, "icon", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {iconOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Title" value={(item as ServiceCardItem).title} onChange={(v) => updateListField("serviceCards", idx, "title", v)} />
                  <InputField label="Description" value={(item as ServiceCardItem).description} onChange={(v) => updateListField("serviceCards", idx, "description", v)} />
                  <InputField label="Link" value={(item as ServiceCardItem).link} onChange={(v) => updateListField("serviceCards", idx, "link", v)} />
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Partner CTA Tab */}
      {activeTab === "partner" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-4 w-4 text-slate-500" />
              Become a Partner Section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Title"
                value={config.partnerSection.title}
                onChange={(v) => setConfig((prev) => ({ ...prev, partnerSection: { ...prev.partnerSection, title: v } }))}
              />
              <InputField
                label="Subtitle"
                value={config.partnerSection.subtitle}
                onChange={(v) => setConfig((prev) => ({ ...prev, partnerSection: { ...prev.partnerSection, subtitle: v } }))}
              />
              <InputField
                label="CTA Text"
                value={config.partnerSection.ctaText}
                onChange={(v) => setConfig((prev) => ({ ...prev, partnerSection: { ...prev.partnerSection, ctaText: v } }))}
              />
              <InputField
                label="CTA Link"
                value={config.partnerSection.ctaLink}
                onChange={(v) => setConfig((prev) => ({ ...prev, partnerSection: { ...prev.partnerSection, ctaLink: v } }))}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  function updateBannerField(idx: number, field: keyof BannerSlide, value: string) {
    setConfig((prev) => ({
      ...prev,
      bannerSlides: prev.bannerSlides.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  function updateListField(listKey: keyof HomepageConfig, idx: number, field: string, value: string) {
    setConfig((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] as any[]).map((item: any, i: number) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  }
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
      />
    </div>
  );
}

function ItemList<T extends { id: string; isActive: boolean }>({
  items,
  onUpdate,
  renderFields,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  renderFields: (item: T, idx: number) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-center text-sm text-slate-400 py-8">No items configured. Add one to get started.</p>;
  }
  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
      {items.map((item, idx) => (
        <div key={item.id} className="rounded-lg border border-slate-200 p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Item {idx + 1}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdate(items.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)))
                }
                className="text-slate-400 hover:text-slate-600"
              >
                {item.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => onUpdate(items.filter((i) => i.id !== item.id))}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {renderFields(item, idx)}
        </div>
      ))}
    </div>
  );
}
